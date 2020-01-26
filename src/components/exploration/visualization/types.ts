export interface ChartProps{
    dateRange: number[], 
    data: Array<{value: number, numberedDate: number}>,
    containerWidth: number, 
    containerHeight: number
}