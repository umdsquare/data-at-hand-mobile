import { SpeechContext, SpeechContextType, TimeSpeechContext } from "./context"
import { Dispatch } from "redux"
import compromise from 'compromise';
compromise.extend(require('compromise-numbers'))
compromise.extend(require('compromise-dates'))
import { preprocess } from "./preprocessor";
import { ActionTypeBase } from "../../../state/types";
import { VariableType, VariableInfo, PreProcessedInputText } from "./types";
import { ExplorationInfo, ExplorationType, ParameterType } from "../../exploration/types";
import { setDateAction, InteractionType, createSetRangeAction } from "../../../state/exploration/interaction/actions";
import { explorationInfoHelper } from "../../exploration/ExplorationInfoHelper";
import { differenceInDays } from "date-fns";
import { DateTimeHelper } from "../../../time";

export class NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolver()
        }

        return this._instance
    }

    private constructor() { }

    async resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo, dispatch: Dispatch): Promise<void> {
        const preprocessed = await preprocess(speech)

        const verbs = this.extractVariablesWithType(preprocessed, VariableType.Verb)
        const dataSources = this.extractVariablesWithType(preprocessed, VariableType.DataSource)
        const dates = this.extractVariablesWithType(preprocessed, VariableType.Date)
        const ranges = this.extractVariablesWithType(preprocessed, VariableType.Period)
        console.log(preprocessed)

        if (dataSources.length === 0 && (dates.length > 0 || ranges.length > 0)) {
            //only time expression.
            const parsedAction = this.processTimeOnlyExpressions(dates, ranges, explorationInfo, context)
            if (parsedAction) {
                dispatch(parsedAction)
            }
            return
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