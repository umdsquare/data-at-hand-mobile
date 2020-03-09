export enum VariableType{
    DataSource="DataSource",
    Date="Date",
    Period="Period",
    Verb="Verb",
    TimeCycle="CyclicTime",
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
    AssignTrivial="Assign",
    Browse="Browse",
    Compare="Compare",
    Highlight="Highlight"
}

export interface VerbInfo{
    root: string,
    type: VerbType
}

export interface NLUOptions{
    getToday: ()=>Date,
}