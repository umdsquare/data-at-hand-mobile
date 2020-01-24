import { DataSourceType } from "../../../measure/DataSourceSpec";

export interface OverviewData{
    sourceDataList: Array<OverviewSourceRow>
}

export interface OverviewSourceRow{
    source: DataSourceType,
    today: {label: string, value: number, formatted: Array<{ text: string, type: "unit" | "value" }>},
    list: any,
    statistics: Array<{label: string, valueText: string}>
}