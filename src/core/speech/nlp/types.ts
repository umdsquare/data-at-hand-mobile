export enum VariableType{
    DataSource="datasource",
    Date="date",
    Period="period"
}

export interface VariableInfo{
    type: VariableType, 
    value: any, 
    originalText: string, 
    id: string
}

export type VariableInfoDict = {
    [id:string]: VariableInfo
}

export interface PreProcessedInputText{
    processed: string,
    original: string,
    variables: VariableInfoDict
}