import React from 'react';
import { ExplorationInfo, ParameterType, IntraDayDataSourceType } from "../../../../../core/exploration/types";
import { explorationInfoHelper } from "../../../../../core/exploration/ExplorationInfoHelper";
import { StepIntraDayPanel } from "./intraday/StepIntraDayPanal";

export function getIntraDayMainPanel(info: ExplorationInfo): any{
    const intraDaySourceType = explorationInfoHelper.getParameterValue(info, ParameterType.IntraDayDataSource)

    switch(intraDaySourceType){
        case IntraDayDataSourceType.StepCount:
            return <StepIntraDayPanel/>
    }
}