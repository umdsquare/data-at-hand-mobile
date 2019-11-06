export enum ChartType{
    TimeseriesBarChart="TBar",
    TimeseriesLineChart="TLine",
    TimeseriesAggregatedLineChart="TAggrLine",
    CategoricalBarChart="CBar",
    SessionChart="Ssn"
}

export interface VisualizationSchema{
    type: ChartType | string,
    dataElements: Array<DataElement>,
    timeFrame: {start: number, end: number}
}

export interface DataElement{
    intrinsicDuration?: {start: number, end: number} 
    value: number
    rawDatumIds: Array<string> 
}