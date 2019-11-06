import { ExplorationStateInfo, ExplorationCommand, ExplorationCommandType, SelectMeasureCommand, ExplorationStateType, DefaultChartPayload } from "../../core/interaction/types";
import { sourceManager } from "../../system/SourceManager";
import { databaseManager } from "../../system/DatabaseManager";
import { startOfDay, endOfDay } from 'date-fns';
import { toDate } from 'date-fns-tz';

import { number } from "prop-types";
import { IDatumBase } from "../../database/types";
import { VisualizationSchema } from "../visualization/types";
import * as visResolver from '../visualization/visualization-resolver';



class ExplorationStateResolver{
    
    async getNewStateInfo(stateInfo: ExplorationStateInfo, command: ExplorationCommand): Promise<ExplorationStateInfo>{

        switch(command.type){
            case ExplorationCommandType.SelectMeasure:
                const castedCommand = command as SelectMeasureCommand
                const start = startOfDay(toDate(command.invokedAt)).getTime()
                const end = endOfDay(toDate(command.invokedAt)).getTime()
                const data = await databaseManager.queryData(castedCommand.measureCode, start, end)
                const newStateInfo = {
                    stateType: ExplorationStateType.DefaultChart,
                    payload: {
                        measureCode: castedCommand.measureCode,
                        queriedDuration: {
                            start,
                            end
                        },
                        visualizationSchema: visResolver.makeDefaultChart(castedCommand.measureCode, data, {start, end})
                    } as DefaultChartPayload
                } as ExplorationStateInfo
                return newStateInfo
            default: return stateInfo
        }
    }

}

export const explorationStateResolver = new ExplorationStateResolver()