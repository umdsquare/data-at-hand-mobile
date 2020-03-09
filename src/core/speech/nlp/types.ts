export enum VariableType{
    DataSource="datasource",
    Date="date",
    Period="period",
    Verb="verb",
    TimeCycle="cyclicTime",
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

export enum VerbType{
    AssignTrivial="assign",
    Browse="browse",
    Compare="compare",
    Highlight="highlight"
}

export interface VerbInfo{
    root: string,
    type: VerbType
}