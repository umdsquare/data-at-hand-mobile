import { SpeechContext, SpeechContextType, TimeSpeechContext, RangeElementSpeechContext } from "./context"
import compromise from 'compromise';
compromise.extend(require('compromise-numbers'))
compromise.extend(require('compromise-dates'))
import { preprocess } from "./preprocessor";
import { ActionTypeBase } from "../../../state/types";
import { VariableType, VariableInfo, PreProcessedInputText, VerbInfo, Intent, NLUOptions, ConditionInfo } from "./types";
import { ExplorationInfo, ExplorationType, ParameterType, inferIntraDayDataSourceType, inferDataSource, HighlightFilter, NumericConditionType } from "../../exploration/types";
import { setDateAction, InteractionType, createSetRangeAction, setDataSourceAction, createGoToBrowseRangeAction, createGoToComparisonTwoRangesAction, createGoToBrowseDayAction, createGoToComparisonCyclicAction, setCycleTypeAction, setHighlightFilter } from "../../../state/exploration/interaction/actions";
import { explorationInfoHelper } from "../../exploration/ExplorationInfoHelper";
import { differenceInDays, isLastDayOfMonth } from "date-fns";
import { DateTimeHelper } from "@utils/time";
import { DataSourceType } from "../../../measure/DataSourceSpec";

enum EntityPriority {
    None = 0,
    Implied = 1,
    Touched = 2,
    Spoken = 3
}

export class NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolver()
        }

        return this._instance
    }

    private constructor() { }

    async resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo, options: NLUOptions): Promise<ActionTypeBase> {

        const preprocessed = await preprocess(speech, options)

        const dataSources = this.extractVariablesWithType(preprocessed, VariableType.DataSource)
        const dates = this.extractVariablesWithType(preprocessed, VariableType.Date)
        const ranges = this.extractVariablesWithType(preprocessed, VariableType.Period)
        const cyclicTimeFrames = this.extractVariablesWithType(preprocessed, VariableType.TimeCycle)
        const conditions = this.extractVariablesWithType(preprocessed, VariableType.Condition)

        console.log(preprocessed)

        const toldDataSources = dataSources.length > 0
        const toldDates = dates.length > 0
        const toldRanges = ranges.length > 0
        const toldCyclicTimeFrames = cyclicTimeFrames.length > 0
        const toldConditions = conditions.length > 0

        const nonVerbVariableExists = Object.keys(preprocessed.variables).find(id => preprocessed.variables[id].type !== VariableType.Verb) != null
        
        if(nonVerbVariableExists === false){
            //reject
            return null
        }

        //Cover cyclic time frame first
        if (cyclicTimeFrames.length > 0) {
            const guaranteedDataSource: DataSourceType = dataSources.length > 0 ? dataSources[0].value : (context["dataSource"] || explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource))
            if (guaranteedDataSource) {
                const guaranteedRange = ranges.length > 0 ? ranges[0].value : (context.type === SpeechContextType.RangeElement ? (context as RangeElementSpeechContext).range : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Range))
                return createGoToComparisonCyclicAction(InteractionType.Speech, guaranteedDataSource, guaranteedRange, cyclicTimeFrames[0].value)
            }
        }

        //First, cover the cases with a reliable intent======================================================================================================
        switch (preprocessed.intent) {

            case Intent.Compare:
                {
                    console.log("Comparison intent")
                    const cascadedDataSource: DataSourceType = toldDataSources === true ? dataSources[0].value :
                        (context["dataSource"] || explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource))
                    if (toldRanges) {
                        let rangeA, rangeB
                        if (ranges.length > 1) {
                            rangeA = ranges[0].value
                            rangeB = ranges[1].value
                        } else {
                            rangeA = context["range"] || explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Range)
                            rangeB = ranges[0].value
                        }

                        if (cascadedDataSource && rangeA && rangeB) {
                            return createGoToComparisonTwoRangesAction(InteractionType.Speech, cascadedDataSource, rangeA, rangeB)
                        }
                    }//Todo cover before and after cases
                }
                break;
            case Intent.AssignTrivial:

                console.log("Assign intent")
                if (!toldDataSources && !toldCyclicTimeFrames && !toldConditions && (toldDates || toldRanges)) {
                    //only time expression
                    return this.processTimeOnlyExpressions(dates, ranges, explorationInfo, context)
                } else if (toldDataSources && !toldConditions && !toldCyclicTimeFrames && !toldDates && !toldRanges) {
                    //only data source
                    //only if the exploration info supports the data source
                    if (explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource) != null) {
                        return setDataSourceAction(InteractionType.Speech, dataSources[0].value)
                    }
                } else if (!toldDataSources && toldCyclicTimeFrames && toldDates === false && toldRanges === false) {
                    //only time cycle
                    if (explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.CycleType) === cyclicTimeFrames[0].value) {
                        return setCycleTypeAction(InteractionType.Speech, cyclicTimeFrames[0].value)
                    }
                }
            //Don't break here. The browse intent logic will cover the rest. 
            case Intent.Browse:
                {
                    console.log("Browse intent")
                    const cascadedDataSource: DataSourceType = toldDataSources === true ? dataSources[0].value :
                        (context["dataSource"] || explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource))

                    let rangePriority: EntityPriority = EntityPriority.None
                    let datePriority: EntityPriority = EntityPriority.None
                    let cascadedRange: [number, number]
                    let cascadedDate: number

                    if (toldRanges) {
                        cascadedRange = ranges[0].value
                        rangePriority = EntityPriority.Spoken
                    } else if (context["range"]) {
                        cascadedRange = context["range"]
                        rangePriority = EntityPriority.Touched
                    } else {
                        cascadedRange = explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Range)
                        if (cascadedRange) {
                            rangePriority = EntityPriority.Implied
                        }
                    }

                    if (toldDates) {
                        cascadedDate = dates[0].value
                        datePriority = EntityPriority.Spoken
                    } else if (context["date"]) {
                        cascadedDate = context["date"]
                        datePriority = EntityPriority.Touched
                    } else {
                        cascadedDate = explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Date)
                        if (cascadedDate) {
                            datePriority = EntityPriority.Implied
                        }
                    }

                    if (cascadedRange || cascadedDate) {
                        if (rangePriority >= datePriority) {
                            if(cascadedDataSource){
                                return createGoToBrowseRangeAction(InteractionType.Speech, cascadedDataSource, cascadedRange)
                            }else{
                                return createSetRangeAction(InteractionType.Speech, cascadedRange)
                            }
                        } else {
                            const inferredIntraDayDataSourceType = inferIntraDayDataSourceType(cascadedDataSource)
                            if (inferredIntraDayDataSourceType) {
                                return createGoToBrowseDayAction(InteractionType.Speech, inferredIntraDayDataSourceType, cascadedDate)
                            }
                        }
                    }
                }
                break;
            case Intent.Highlight:
                console.log("Highlight intent")
                const conditionInfo = conditions[0].value as ConditionInfo
                let cascadedDataSource: DataSourceType = toldDataSources ? dataSources[0].value : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)

                if (!cascadedDataSource) {
                    console.log("Failed to initialize the highlight intent.")
                    //TODO infer data source implied by the adverb or adjective, such as "heavier".
                }

                if (conditionInfo.property == "waketime" || conditionInfo.property == 'bedtime') {
                    cascadedDataSource = DataSourceType.SleepRange
                }

                if (cascadedDataSource) {
                    const highlightFilter: HighlightFilter = {
                        ...conditionInfo,
                        dataSource: cascadedDataSource
                    }
                    console.log("set highlight filter")
                    return setHighlightFilter(InteractionType.Speech, highlightFilter)
                }
                break;
        }

        //=====================================================================================================================================================

        //Cover cases with trivial intent
        console.log("this is a corner case.")

    }

    private extractVariablesWithType(processed: PreProcessedInputText, type: VariableType): VariableInfo[] {
        return Object.keys(processed.variables).filter(id => processed.variables[id].type === type).map(id => processed.variables[id])
    }

    //============
    private processTimeOnlyExpressions(dates: VariableInfo[], ranges: VariableInfo[], explorationInfo: ExplorationInfo, context: SpeechContext): ActionTypeBase | null {
        switch (explorationInfo.type) {
            case ExplorationType.B_Day:
                if (dates.length > 0) {
                    return setDateAction(InteractionType.Speech, dates[0].value as number)
                } else if (ranges.length > 0) {
                    return createGoToBrowseRangeAction(InteractionType.Speech, inferDataSource(explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.IntraDayDataSource))
                        , ranges[0].value)
                }
            case ExplorationType.B_Overview:
            case ExplorationType.B_Range:
            case ExplorationType.C_Cyclic:
            case ExplorationType.C_CyclicDetail_Daily:
            case ExplorationType.C_CyclicDetail_Range:
                if (ranges.length > 0) {
                    return createSetRangeAction(InteractionType.Speech, ranges[0].value as [number, number])
                }
                if (dates.length > 0) {
                    const date = dates[0].value
                    const currentRange = explorationInfoHelper.getParameterValue<[number, number]>(explorationInfo, ParameterType.Range)

                    if (currentRange[0] === date || currentRange[1] === date) {
                        return null
                    }

                    if (context.type === SpeechContextType.Time) {
                        const timeContext = context as TimeSpeechContext

                        if (timeContext.timeElementType === 'from') {
                            return createSetRangeAction(InteractionType.Speech, [Math.min(date, currentRange[1]), Math.max(date, currentRange[1])])
                        } else if (timeContext.timeElementType === 'to') {
                            return createSetRangeAction(InteractionType.Speech, [Math.min(date, currentRange[0]), Math.max(date, currentRange[0])])
                        }
                    }

                    if (date < currentRange[0]) {
                        return createSetRangeAction(InteractionType.Speech, [date, currentRange[1]])
                    } else if (date > currentRange[1]) {
                        return createSetRangeAction(InteractionType.Speech, [currentRange[0], date])
                    } else {
                        //middle. change more near one
                        const differLeft = differenceInDays(DateTimeHelper.toDate(date), DateTimeHelper.toDate(currentRange[0]))
                        const differRight = differenceInDays(DateTimeHelper.toDate(currentRange[1]), DateTimeHelper.toDate(date))
                        if (differLeft <= differRight) {
                            return createSetRangeAction(InteractionType.Speech, [date, currentRange[1]])
                        } else return createSetRangeAction(InteractionType.Speech, [currentRange[0], date])
                    }
                }
                break;
            case ExplorationType.C_TwoRanges:
                switch (context.type) {
                    case SpeechContextType.RangeElement:
                        {
                            const c = context as RangeElementSpeechContext
                            if (ranges.length > 0) {
                                const parameter = explorationInfo.values.find(parameter => parameter.parameter === ParameterType.Range && parameter.value[0] === c.range[0] && parameter.value[1] === c.range[1])

                                if (parameter) {
                                    return createSetRangeAction(InteractionType.Speech, ranges[0].value, parameter.key)
                                }
                            }
                        }
                        break;
                    case SpeechContextType.Time:
                        {
                            const timeContext = context as TimeSpeechContext
                            const currentRange = explorationInfoHelper.getParameterValue<[number, number]>(explorationInfo, ParameterType.Range, timeContext.parameterKey)
                            if (dates.length > 0) {
                                const date = dates[0].value
                                if (timeContext.timeElementType === 'from') {
                                    return createSetRangeAction(InteractionType.Speech, [Math.min(date, currentRange[1]), Math.max(date, currentRange[1])], timeContext.parameterKey)
                                } else if (timeContext.timeElementType === 'to') {
                                    return createSetRangeAction(InteractionType.Speech, [Math.min(date, currentRange[0]), Math.max(date, currentRange[0])], timeContext.parameterKey)
                                }
                            }
                            if(ranges.length > 0){
                                return createSetRangeAction(InteractionType.Speech, ranges[0].value, timeContext.parameterKey)
                            }
                        }
                        break;
                }
                break;
        }
    }
}