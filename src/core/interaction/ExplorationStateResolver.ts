import { ExplorationStateInfo, ExplorationCommand, ExplorationCommandType, SelectMeasureCommand, ExplorationStateType, DefaultChartPayload } from "../../core/interaction/types";
import { databaseManager } from "../../system/DatabaseManager";

import * as visResolver from '../visualization/visualization-resolver';
import { Presets, semanticToDuration } from "./time";



class ExplorationStateResolver{
    
    async getNewStateInfo(stateInfo: ExplorationStateInfo, command: ExplorationCommand): Promise<ExplorationStateInfo>{

        switch(command.type){
            case ExplorationCommandType.SelectMeasure:
                const castedCommand = command as SelectMeasureCommand
                const durationSemantic = Presets.LAST_WEEKEND
                const duration = semanticToDuration(durationSemantic, command.invokedAt)
                const data = await databaseManager.queryData(castedCommand.measureCode, duration.from, duration.to)
                const newStateInfo = {
                    stateType: ExplorationStateType.DefaultChart,
                    command: command,
                    payload: {
                        measureCode: castedCommand.measureCode,
                        queriedDuration: durationSemantic,
                        visualizationSchema: visResolver.makeDefaultChart(castedCommand.measureCode, data, {start: duration.from, end: duration.to})
                    } as DefaultChartPayload
                } as ExplorationStateInfo
                return newStateInfo
            default: return stateInfo
        }
    }

}

export const explorationStateResolver = new ExplorationStateResolver()