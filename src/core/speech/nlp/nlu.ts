import { SpeechContext, SpeechContextType, TimeSpeechContext, RangeElementSpeechContext } from "./context"
import { Dispatch } from "redux"
import compromise from 'compromise';
compromise.extend(require('compromise-numbers'))
compromise.extend(require('compromise-dates'))
import { preprocess } from "./preprocessor";
import { ActionTypeBase } from "../../../state/types";
import { VariableType, VariableInfo, PreProcessedInputText, VerbInfo, VerbType } from "./types";
import { ExplorationInfo, ExplorationType, ParameterType, inferIntraDayDataSourceType, IntraDayDataSourceType } from "../../exploration/types";
import { setDateAction, InteractionType, createSetRangeAction, setDataSourceAction, setIntraDayDataSourceAction, createGoToBrowseRangeAction, createGoToComparisonTwoRangesAction, createGoToBrowseDayAction, setParametersAction, createGoToComparisonCyclicAction } from "../../../state/exploration/interaction/actions";
import { explorationInfoHelper } from "../../exploration/ExplorationInfoHelper";
import { differenceInDays } from "date-fns";
import { DateTimeHelper } from "../../../time";
import { DataSourceType } from "../../../measure/DataSourceSpec";

export class NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolver()
        }

        return this._instance
    }

    private constructor() { }

    async resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo): Promise<ActionTypeBase> {
        const preprocessed = await preprocess(speech)

        const verbs = this.extractVariablesWithType(preprocessed, VariableType.Verb)
        const dataSources = this.extractVariablesWithType(preprocessed, VariableType.DataSource)
        const dates = this.extractVariablesWithType(preprocessed, VariableType.Date)
        const ranges = this.extractVariablesWithType(preprocessed, VariableType.Period)
        const cyclicTimeFrames = this.extractVariablesWithType(preprocessed, VariableType.TimeCycle)
        console.log(preprocessed)

        const mainVerb: VerbInfo = verbs.length > 0 ? verbs[0].value : null
        const mainVerbType = mainVerb != null ? mainVerb.type : VerbType.AssignTrivial

        if ((mainVerb == null || mainVerbType === VerbType.AssignTrivial)) {
            //change time expression.
            if (dataSources.length === 0 && cyclicTimeFrames.length === 0 && (dates.length > 0 || ranges.length > 0)) {
                return this.processTimeOnlyExpressions(dates, ranges, explorationInfo, context)
            }
        }

        //Cover cyclic time frame first
        if (cyclicTimeFrames.length > 0) {
            const guaranteedDataSource: DataSourceType = dataSources.length > 0 ? dataSources[0].value : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)
            const guaranteedRange = ranges.length > 0 ? ranges[0].value : (context.type === SpeechContextType.RangeElement ? (context as RangeElementSpeechContext).range : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.CycleType))
            return createGoToComparisonCyclicAction(InteractionType.Speech, guaranteedDataSource, guaranteedRange, cyclicTimeFrames[0].value)
        }

        switch (explorationInfo.type) {
            case ExplorationType.B_Overview:
                //no data source available. access the data source range detail page.
                if (dataSources.length > 0) {
                    const dataSource = dataSources[0].value as DataSourceType
                    if (ranges.length == 1) {
                        if (mainVerbType === VerbType.Compare) {
                            //compare data source with the range
                            return createGoToComparisonTwoRangesAction(InteractionType.Speech,
                                dataSource,
                                explorationInfoHelper.getParameterValue<[number, number]>(explorationInfo, ParameterType.Range),
                                ranges[0].value
                            )
                        } else if (mainVerbType !== VerbType.Highlight) {
                            return createGoToBrowseRangeAction(InteractionType.Speech, dataSource, ranges[0].value as [number, number])
                        }
                    } else if (ranges.length > 1) {
                        //compare
                        return createGoToComparisonTwoRangesAction(InteractionType.Speech, dataSource, ranges[0].value, ranges[1].value)
                    } else if (dates.length > 0) {
                        //TODO cover before/after
                        const intraDayDataSource = inferIntraDayDataSourceType(dataSource)
                        if (intraDayDataSource) {
                            return createGoToBrowseDayAction(InteractionType.Speech, intraDayDataSource, dates[0].value)
                        }
                    } else return createGoToBrowseRangeAction(InteractionType.Speech, dataSource)
                }
                break;
            case ExplorationType.B_Range:
                {
                    const guaranteedDataSource: DataSourceType = dataSources.length > 0 ? dataSources[0].value : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)

                    if (mainVerbType === VerbType.Compare) {
                        if(ranges.length > 1){
                            return createGoToComparisonTwoRangesAction(InteractionType.Speech, guaranteedDataSource, ranges[0].value, ranges[1].value)
                        }else if(ranges.length === 1){
                            return createGoToComparisonTwoRangesAction(InteractionType.Speech, guaranteedDataSource, explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Range), ranges[0].value)
                        }
                    } else {
                        if (ranges.length === 1) {
                            const range = ranges[0].value as [number, number]
                            return setParametersAction(InteractionType.Speech,
                                { parameter: ParameterType.Range, value: range },
                                { parameter: ParameterType.DataSource, value: guaranteedDataSource }
                            )
                        } else if (ranges.length > 1) {
                            //compare two ranges
                            return createGoToComparisonTwoRangesAction(InteractionType.Speech, guaranteedDataSource, ranges[0].value, ranges[1].value)
                        } else if (dates.length > 0) {
                            //go to the daily data
                            const intraDayDataSource = inferIntraDayDataSourceType(guaranteedDataSource)
                            if (intraDayDataSource) {
                                return createGoToBrowseDayAction(InteractionType.Speech, intraDayDataSource, dates[0].value)
                            }
                        } else {
                            return setDataSourceAction(InteractionType.Speech, guaranteedDataSource)
                        }
                    }
                }
                break;
            case ExplorationType.B_Day:
                {//get intraday data source.
                    if (dataSources.length > 0) {
                        if (ranges.length === 0) {
                            const dataSource = dataSources[0].value as DataSourceType
                            const intraDayDataSource = inferIntraDayDataSourceType(dataSource)
                            if (intraDayDataSource != null) {
                                if (dates.length > 0) {
                                    return setParametersAction(InteractionType.Speech, {
                                        parameter: ParameterType.IntraDayDataSource,
                                        value: intraDayDataSource
                                    }, {
                                        parameter: ParameterType.Date,
                                        value: dates[0].value
                                    })
                                } else return setIntraDayDataSourceAction(InteractionType.Speech, intraDayDataSource)
                            } else return null
                        }
                    } else {

                    }
                }
                break;
        }

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
                //TODO implement the two ranges case.    
                break;
        }
    }
}