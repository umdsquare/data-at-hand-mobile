import { SpeechContext, SpeechContextType, TimeSpeechContext, RangeElementSpeechContext, GlobalSpeechContext, CategoricalRowElementSpeechContext, CycleDimensionElementSpeechContext, DateElementSpeechContext } from "@data-at-hand/core/speech/SpeechContext"
import { preprocess } from "./preprocessor";
import { ActionTypeBase } from "../../../state/types";
import { NLUOptions, NLUCommandResolver } from "./types";
import { setDateAction, createSetRangeAction, setDataSourceAction, createGoToBrowseRangeAction, createGoToComparisonTwoRangesAction, createGoToBrowseDayAction, createGoToComparisonCyclicAction, setCycleTypeAction, setHighlightFilter, setIntraDayDataSourceAction, setCycleDimensionAction, createGoToCyclicDetailDailyAction, createGoToCyclicDetailRangeAction } from "../../../state/exploration/interaction/actions";
import { explorationInfoHelper } from "../../exploration/ExplorationInfoHelper";
import { differenceInDays, addDays } from "date-fns";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import { DataSourceType, inferIntraDayDataSourceType, inferDataSource } from "@data-at-hand/core/measure/DataSourceSpec";
import { ExplorationState, explorationStateReducer } from "@state/exploration/interaction/reducers";
import { ExplorationInfo, ParameterType, HighlightFilter, ExplorationType } from "@data-at-hand/core/exploration/ExplorationInfo";
import { InteractionType } from "@data-at-hand/core/exploration/actions";
import { NLUResult, NLUResultType, VariableType, Intent, ConditionInfo, PreProcessedInputText, VariableInfo } from "@data-at-hand/core/speech/types";
import { fastConcatTo } from "@data-at-hand/core/utils";
import { getCycleLevelOfDimension } from "@data-at-hand/core/exploration/CyclicTimeFrame";

import stringFormat from 'string-format';

const FORMAT_MULTIMODAL_MESSAGE = 'As you pressed <b>{element}</b>, Data@Hand expects to receive <b>{receive}</b>.'

enum EntityPriority {
    None = 0,
    Implied = 1,
    Touched = 2,
    Spoken = 3
}

export default class NLUCommandResolverImpl implements NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolverImpl()
        }

        return this._instance
    }

    private constructor() { }

    private getCascadedDataSource(dataSourceVariables: VariableInfo[] | null | undefined, context: SpeechContext, explorationInfo: ExplorationInfo): DataSourceType | undefined {
        return dataSourceVariables != null && dataSourceVariables.length > 0 ? dataSourceVariables[0].value :
            (
                (context as any)["dataSource"]
                || explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)
                || inferDataSource(explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.IntraDayDataSource))
            )
            || (context.uiStatus["viewableDataSources"] != null && context.uiStatus["viewableDataSources"].length > 0 ? context.uiStatus["viewableDataSources"][0] as DataSourceType : null)
    }

    private static convertActionToNLUResult(action: ActionTypeBase | undefined | null, currentInfo: ExplorationInfo, preprocessed: PreProcessedInputText): NLUResult {
        if (action) {

            //effective/void/unapplicable
            const fakeFormerState = {
                info: currentInfo,
                backNavStack: [],
                uiStatus: {},
            } as ExplorationState
            const nextState = explorationStateReducer(fakeFormerState, action)

            let type: NLUResultType

            if (nextState == fakeFormerState) {
                //state did not change.
                type = NLUResultType.Unapplicable
            } else if (explorationInfoHelper.equals(fakeFormerState.info, nextState.info)) {
                //void
                type = NLUResultType.Void
            } else {
                type = NLUResultType.Effective
            }

            return {
                type,
                action,
                preprocessed
            }
        } else {
            return {
                type: NLUResultType.Fail,
                preprocessed
            }
        }
    }

    private analyzeVariables(preprocessed: PreProcessedInputText): {
        dataSources: Array<VariableInfo>,
        dates: Array<VariableInfo>,
        ranges: Array<VariableInfo>,
        cyclicTimeFrames: Array<VariableInfo>,
        conditions: Array<VariableInfo>,
        toldDataSources: boolean,
        toldDates: boolean,
        toldRanges: boolean,
        toldCyclicTimeFrames: boolean,
        toldConditions: boolean
    } {

        const dataSources = this.extractVariablesWithType(preprocessed, VariableType.DataSource)
        const dates = this.extractVariablesWithType(preprocessed, VariableType.Date)
        const ranges = this.extractVariablesWithType(preprocessed, VariableType.Period)
        const cyclicTimeFrames = this.extractVariablesWithType(preprocessed, VariableType.TimeCycle)
        const conditions = this.extractVariablesWithType(preprocessed, VariableType.Condition)

        const toldDataSources = dataSources.length > 0
        const toldDates = dates.length > 0
        const toldRanges = ranges.length > 0
        const toldCyclicTimeFrames = cyclicTimeFrames.length > 0
        const toldConditions = conditions.length > 0

        return {
            dataSources,
            dates,
            ranges,
            cyclicTimeFrames,
            conditions,
            toldDataSources,
            toldDates,
            toldRanges,
            toldCyclicTimeFrames,
            toldConditions
        }
    }

    async resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo, options: NLUOptions): Promise<NLUResult> {

        const preprocessed = await preprocess(speech, options, this.getCascadedDataSource(null, context, explorationInfo))

        console.debug(preprocessed)

        const {
            dataSources,
            dates,
            ranges,
            cyclicTimeFrames,
            conditions,
            toldDataSources,
            toldDates,
            toldRanges,
            toldCyclicTimeFrames,
            toldConditions
        } = this.analyzeVariables(preprocessed)

        if (Object.keys(preprocessed.variables).find(id => preprocessed.variables[id].type !== VariableType.Verb) == null) {
            //reject
            return {
                type: NLUResultType.Fail,
                preprocessed
            }
        }

        //check multimodal commands first
        if (context.type !== SpeechContextType.Global) {
            //In this status, first check the command is valid for multimodal and return the result in the switch block.
            //Deal with the rejected commands after the switch block.

            let messageBlock: string | undefined = undefined

            switch (context.type) {
                case SpeechContextType.Time:
                    {
                        const c = context as TimeSpeechContext
                        //In multimodal commands for time, only the period change is supported.
                        if (preprocessed.intent === Intent.AssignTrivial && !toldDataSources && !toldCyclicTimeFrames && !toldConditions && (toldDates || toldRanges)) {
                            //pure time assignment command
                            return NLUCommandResolverImpl.convertActionToNLUResult(
                                this.processTimeOnlyExpressions(dates, ranges, explorationInfo, context),
                                explorationInfo, preprocessed)
                        } else {
                            const receive = "a date or period"
                            switch (c.timeElementType) {
                                case "from":
                                    messageBlock = stringFormat(FORMAT_MULTIMODAL_MESSAGE, { element: "the start date", receive })
                                    break;
                                case "to":
                                    messageBlock = stringFormat(FORMAT_MULTIMODAL_MESSAGE, { element: "the end date", receive })
                                    break;
                                case "date":
                                    messageBlock = stringFormat(FORMAT_MULTIMODAL_MESSAGE, { element: "the date", receive })
                                    break;
                                case "period":
                                    messageBlock = stringFormat(FORMAT_MULTIMODAL_MESSAGE, { element: "the period", receive })
                                    break;
                            }
                        }
                    }
                    break;
                case SpeechContextType.CycleDimensionElement:
                    {
                        if (preprocessed.intent !== Intent.Highlight && preprocessed.intent !== Intent.Compare) {
                            if (toldDataSources && !toldConditions && !toldCyclicTimeFrames && !toldDates && !toldRanges) {
                                const c = context as CycleDimensionElementSpeechContext
                                const dimension = c.cycleDimension
                                let action
                                if (getCycleLevelOfDimension(dimension) === 'day') {
                                    action = createGoToCyclicDetailDailyAction(InteractionType.Speech, dataSources[0].value, undefined, dimension)
                                } else {
                                    action = createGoToCyclicDetailRangeAction(InteractionType.Speech, dataSources[0].value, undefined, dimension)
                                }

                                return NLUCommandResolverImpl.convertActionToNLUResult(action, explorationInfo, preprocessed)
                            }
                        }
                    }
                    break;

                case SpeechContextType.DateElement:
                    {
                        if (preprocessed.intent !== Intent.Highlight && preprocessed.intent !== Intent.Compare) {
                            if (toldDataSources && !toldConditions && !toldCyclicTimeFrames && !toldDates && !toldRanges) {
                                const c = context as DateElementSpeechContext
                                const dataSource = dataSources[0].value

                                const inferredIntraDayDataSourceType = inferIntraDayDataSourceType(dataSource)
                                if (inferredIntraDayDataSourceType) {
                                    return NLUCommandResolverImpl.convertActionToNLUResult(
                                        createGoToBrowseDayAction(InteractionType.Speech, inferredIntraDayDataSourceType, c.date),
                                        explorationInfo, preprocessed)
                                } else {
                                    console.log(dataSource + " is not supported intraday. Show the around data instead")
                                    const startDate = DateTimeHelper.toNumberedDateFromDate(addDays(DateTimeHelper.toDate(c.date), -3))
                                    const endDate = DateTimeHelper.toNumberedDateFromDate(addDays(DateTimeHelper.toDate(c.date), 3))

                                    return NLUCommandResolverImpl.convertActionToNLUResult(
                                        createGoToBrowseRangeAction(InteractionType.Speech, dataSource, [startDate, endDate]),
                                        explorationInfo, preprocessed)
                                }
                            }
                        }
                    }
                    break;
                case SpeechContextType.RangeElement:
                    {
                        /*
                        * Four possible commands:
                        * 1. go to browse the range of new data source
                        * 2. change this range
                        * 3. change the other range
                        * 4. go to cyclic view of the range
                        * 5. go to browsing, highlighted with condition
                        */

                        const c = context as RangeElementSpeechContext

                        //1.
                        if (preprocessed.intent !== Intent.Highlight && preprocessed.intent !== Intent.Compare) {
                            if (toldDataSources && !toldConditions && !toldCyclicTimeFrames && !toldDates && !toldRanges) {
                                const dataSource = dataSources[0].value

                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createGoToBrowseRangeAction(InteractionType.Speech, dataSource, undefined),
                                    explorationInfo, preprocessed)
                            }
                        }

                        //2.
                        if (preprocessed.intent === Intent.AssignTrivial && toldRanges && ranges.length === 1) {

                            const parameter = explorationInfo.values.find(parameter => parameter.parameter === ParameterType.Range && parameter.value[0] === c.range[0] && parameter.value[1] === c.range[1])

                            if (parameter) {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createSetRangeAction(InteractionType.Speech, undefined, ranges[0].value, parameter.key),
                                    explorationInfo, preprocessed)
                            }
                        }

                        //3.
                        if (preprocessed.intent === Intent.Compare && toldRanges && ranges.length === 1) {
                            const guaranteedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)

                            return NLUCommandResolverImpl.convertActionToNLUResult(
                                createGoToComparisonTwoRangesAction(InteractionType.Speech, guaranteedDataSource, c.range, ranges[0].value),
                                explorationInfo, preprocessed)

                        }

                        //4.
                        if (toldCyclicTimeFrames && !toldRanges && !toldDates) {
                            const guaranteedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)
                            if (guaranteedDataSource) {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createGoToComparisonCyclicAction(InteractionType.Speech, guaranteedDataSource, c.range, cyclicTimeFrames[0].value),
                                    explorationInfo, preprocessed)
                            }
                        }

                        //5.
                        if (toldConditions && !toldCyclicTimeFrames && !toldRanges && !toldDates) {
                            const guaranteedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)
                            if (guaranteedDataSource) {

                                const conditionInfo = conditions[0]?.value as ConditionInfo
                                const cascadedDataSource: DataSourceType = toldDataSources ? dataSources[0].value : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)
                                const dataSource = conditionInfo.impliedDataSource || cascadedDataSource
                                if (dataSource) {
                                    const highlightFilter: HighlightFilter = {
                                        ...conditionInfo,
                                        dataSource
                                    }

                                    return NLUCommandResolverImpl.convertActionToNLUResult(
                                        createGoToBrowseRangeAction(InteractionType.Speech, dataSource, undefined, highlightFilter),
                                        explorationInfo, preprocessed)
                                }

                            }
                        }

                    }
                    break;
            }

            //If the code reaches here, the command is rejected as it is not related to the multimodal interaction.
            console.log("Not a multimodal command")

            //simulate the global speech result
            const simulatedGlobalInterpretationResult = this.processGlobalSpeechCommand(preprocessed, { type: SpeechContextType.Global, uiStatus: context.uiStatus, explorationType: explorationInfo.type }, explorationInfo)

            if (simulatedGlobalInterpretationResult.type === NLUResultType.Effective || simulatedGlobalInterpretationResult.type === NLUResultType.Void) {
                console.log("prompt a global command")
                return {
                    type: NLUResultType.NeedPromptingToGlobalCommand,
                    message: messageBlock,
                    preprocessed: preprocessed,
                    globalCommandSimulatedResult: simulatedGlobalInterpretationResult
                }
            } else {

            }
        } else {
            //global speech
            return this.processGlobalSpeechCommand(preprocessed, context as GlobalSpeechContext, explorationInfo)
        }

        //Cover cases with trivial intent
        console.log("this is a corner case.")

        return {
            type: NLUResultType.Fail,
            preprocessed
        }
    }

    private processGlobalSpeechCommand(preprocessed: PreProcessedInputText, context: GlobalSpeechContext, explorationInfo: ExplorationInfo): NLUResult {

        const {
            dataSources,
            dates,
            ranges,
            cyclicTimeFrames,
            conditions,
            toldDataSources,
            toldDates,
            toldRanges,
            toldCyclicTimeFrames,
            toldConditions
        } = this.analyzeVariables(preprocessed)

        //Cover cyclic time frame first
        if (cyclicTimeFrames.length > 0) {
            const guaranteedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)
            if (guaranteedDataSource) {
                const guaranteedRange = ranges.length > 0 ? ranges[0].value : (explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Range))
                return NLUCommandResolverImpl.convertActionToNLUResult(
                    createGoToComparisonCyclicAction(InteractionType.Speech, guaranteedDataSource, guaranteedRange, cyclicTimeFrames[0].value),
                    explorationInfo, preprocessed)
            }
        }



        //First, cover the cases with a reliable intent======================================================================================================
        switch (preprocessed.intent) {

            case Intent.Compare:
                {
                    console.log("Comparison intent")
                    const cascadedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)
                    let extractedRanges: Array<[number, number]> = []

                    if (toldRanges) {
                        fastConcatTo(extractedRanges, ranges.map(r => r.value))
                    }

                    if (toldDates) {
                        fastConcatTo(extractedRanges, dates.map(d => [d.value, d.value]))
                    }

                    if (extractedRanges.length < 2) {
                        const rangesInInfo = explorationInfo.values.filter(v => v.parameter === ParameterType.Range)
                        if(rangesInInfo.length > 1){
                            //ambiguity.
                            return {
                                type: NLUResultType.Fail,
                                preprocessed,
                                message: "There are more than one range."
                            }
                        }else if(rangesInInfo.length === 1){
                            extractedRanges.unshift(rangesInInfo[0].value)
                        }
                    }

                    if (cascadedDataSource && extractedRanges.length >= 2) {
                        return NLUCommandResolverImpl.convertActionToNLUResult(
                            createGoToComparisonTwoRangesAction(InteractionType.Speech, cascadedDataSource, extractedRanges[0], extractedRanges[1]),
                            explorationInfo, preprocessed)
                    }
                }
                break;
            case Intent.AssignTrivial:

                console.log("Assign intent")
                if (!toldDataSources && !toldCyclicTimeFrames && !toldConditions && (toldDates || toldRanges)) {
                    //only time expression
                    return NLUCommandResolverImpl.convertActionToNLUResult(
                        this.processTimeOnlyExpressions(dates, ranges, explorationInfo, context),
                        explorationInfo, preprocessed)
                } else if (toldDataSources && !toldConditions && !toldCyclicTimeFrames && !toldDates && !toldRanges) {
                    //only data source
                    //only if the exploration info supports the data source
                    if (explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource) != null) {
                        return NLUCommandResolverImpl.convertActionToNLUResult(
                            setDataSourceAction(InteractionType.Speech, undefined, dataSources[0].value),
                            explorationInfo, preprocessed)
                    }
                } else if (!toldDataSources && toldCyclicTimeFrames && toldDates === false && toldRanges === false) {
                    //only time cycle
                    if (explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.CycleType) === cyclicTimeFrames[0].value) {
                        return NLUCommandResolverImpl.convertActionToNLUResult(
                            setCycleTypeAction(InteractionType.Speech, null, cyclicTimeFrames[0].value),
                            explorationInfo, preprocessed)
                    }
                }
            //Don't break here. The browse intent logic will cover the rest. 
            case Intent.Browse:
                {
                    console.log("Browse intent")
                    const cascadedDataSource = this.getCascadedDataSource(dataSources, context, explorationInfo)

                    let rangePriority: EntityPriority = EntityPriority.None
                    let datePriority: EntityPriority = EntityPriority.None
                    let cascadedRange: [number, number]
                    let cascadedDate: number

                    if (toldRanges) {
                        cascadedRange = ranges[0].value
                        rangePriority = EntityPriority.Spoken
                    } else if ((context as any)["range"]) {
                        cascadedRange = (context as any)["range"]
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
                    } else if ((context as any)["date"]) {
                        cascadedDate = (context as any)["date"]
                        datePriority = EntityPriority.Touched
                    } else {
                        cascadedDate = explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.Date)
                        if (cascadedDate) {
                            datePriority = EntityPriority.Implied
                        }
                    }

                    if (cascadedRange || cascadedDate) {
                        if (rangePriority >= datePriority) {
                            if (explorationInfo.type === ExplorationType.B_Overview && toldDataSources === false && (context.type === SpeechContextType.Global || context.type === SpeechContextType.Time)) {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createSetRangeAction(InteractionType.Speech, undefined, cascadedRange),
                                    explorationInfo, preprocessed)
                            } else if (cascadedDataSource) {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createGoToBrowseRangeAction(InteractionType.Speech, cascadedDataSource, cascadedRange),
                                    explorationInfo, preprocessed)
                            } else {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createSetRangeAction(InteractionType.Speech, undefined, cascadedRange),
                                    explorationInfo, preprocessed)
                            }
                        } else {
                            const inferredIntraDayDataSourceType = inferIntraDayDataSourceType(cascadedDataSource)
                            if (inferredIntraDayDataSourceType) {
                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createGoToBrowseDayAction(InteractionType.Speech, inferredIntraDayDataSourceType, cascadedDate),
                                    explorationInfo, preprocessed)
                            } else {
                                console.log(cascadedDataSource + " is not supported intraday. Show the around data instead")
                                const startDate = DateTimeHelper.toNumberedDateFromDate(addDays(DateTimeHelper.toDate(cascadedDate), -3))
                                const endDate = DateTimeHelper.toNumberedDateFromDate(addDays(DateTimeHelper.toDate(cascadedDate), 3))

                                return NLUCommandResolverImpl.convertActionToNLUResult(
                                    createGoToBrowseRangeAction(InteractionType.Speech, cascadedDataSource, [startDate, endDate]),
                                    explorationInfo, preprocessed)
                            }
                        }
                    }
                }
                break;
            case Intent.Highlight:
                console.log("Highlight intent")
                const conditionInfo = conditions[0].value as ConditionInfo
                const cascadedDataSource: DataSourceType = toldDataSources ? dataSources[0].value : explorationInfoHelper.getParameterValue(explorationInfo, ParameterType.DataSource)

                const dataSource: DataSourceType = conditionInfo.impliedDataSource || cascadedDataSource

                if (dataSource) {
                    const highlightFilter: HighlightFilter = {
                        ...conditionInfo,
                        dataSource
                    }
                    return NLUCommandResolverImpl.convertActionToNLUResult(setHighlightFilter(InteractionType.Speech, highlightFilter),
                        explorationInfo, preprocessed)
                }
                break;
        }

        //=====================================================================================================================================================

        //Cover cases with trivial intent
        console.log("this is a corner case.")

        return {
            type: NLUResultType.Fail,
            preprocessed
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
                    return setDateAction(InteractionType.Speech, undefined, dates[0].value as number)
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
                    return createSetRangeAction(InteractionType.Speech, undefined, ranges[0].value as [number, number])
                }
                if (dates.length > 0) {
                    const date = dates[0].value
                    const currentRange = explorationInfoHelper.getParameterValue<[number, number]>(explorationInfo, ParameterType.Range)

                    if (context.type === SpeechContextType.Time) {
                        const timeContext = context as TimeSpeechContext

                        if (timeContext.timeElementType === 'from') {
                            return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[1]), Math.max(date, currentRange[1])])
                        } else if (timeContext.timeElementType === 'to') {
                            return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[0]), Math.max(date, currentRange[0])])
                        }
                    }

                    if (dates[0].additionalInfo === 'from') {
                        return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[1]), Math.max(date, currentRange[1])])
                    } else if (dates[0].additionalInfo === 'to') {
                        return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[0]), Math.max(date, currentRange[0])])
                    }

                    if (date < currentRange[0]) {
                        return createSetRangeAction(InteractionType.Speech, undefined, [date, currentRange[1]])
                    } else if (date > currentRange[1]) {
                        return createSetRangeAction(InteractionType.Speech, undefined, [currentRange[0], date])
                    } else {
                        //middle. change more near one
                        const differLeft = differenceInDays(DateTimeHelper.toDate(date), DateTimeHelper.toDate(currentRange[0]))
                        const differRight = differenceInDays(DateTimeHelper.toDate(currentRange[1]), DateTimeHelper.toDate(date))
                        if (differLeft <= differRight) {
                            return createSetRangeAction(InteractionType.Speech, undefined, [date, currentRange[1]])
                        } else return createSetRangeAction(InteractionType.Speech, undefined, [currentRange[0], date])
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
                                    return createSetRangeAction(InteractionType.Speech, undefined, ranges[0].value, parameter.key)
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
                                    return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[1]), Math.max(date, currentRange[1])], timeContext.parameterKey)
                                } else if (timeContext.timeElementType === 'to') {
                                    return createSetRangeAction(InteractionType.Speech, undefined, [Math.min(date, currentRange[0]), Math.max(date, currentRange[0])], timeContext.parameterKey)
                                }
                            }
                            if (ranges.length > 0) {
                                return createSetRangeAction(InteractionType.Speech, undefined, ranges[0].value, timeContext.parameterKey)
                            }
                        }
                        break;
                }
                break;
        }
    }
}