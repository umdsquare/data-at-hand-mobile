import { DataSourceType } from "../../../measure/DataSourceSpec";
import { DailySummaryDatum } from "../../../database/types";

export interface OverviewData{
    sourceDataList: Array<OverviewSourceRow>
}

export interface OverviewSourceRow{
    source: DataSourceType,
    today: {label: string, value: number, formatted: Array<{ text: string, type: "unit" | "value" }>},
    list: Array<DailySummaryDatum>,
    statistics: Array<{label: string, valueText: string}>
}