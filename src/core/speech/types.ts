import { EmitterSubscription, EventSubscription } from "react-native";

export enum Command{
    DEFAULT_FALLBACK = "Default Fallback Intent"
}

export interface DictationResult{
    text: string,
    segments: Array<{text: string, confidence: number}>,
    diffResult?: Array<{value: string, added?: boolean, removed?: boolean}>
}

export interface IVoiceDictator{
    install(): Promise<boolean>
    uninstall(): Promise<boolean>
    isAvailableInSystem(): Promise<boolean>
    registerStartEventListener(listener: ()=>void): EventSubscription
    registerReceivedEventListener(listener: (result: DictationResult) => void): EventSubscription
    registerStopEventListener(listener: (error)=>void): EventSubscription
    start(): Promise<boolean>
    stop(): Promise<boolean>
}

export interface NLUResult{
    utterance: string,
    intent: string,
    confidence: number,
    parameters: any
}

export interface INaturalLanguageAnalyzer{
    initialize(): Promise<void>
    dispose(): Promise<void>

    process(text): Promise<{result: NLUResult, error: any}>
}


export enum SpeechRecognitionEventType {
    EVENT_STARTED = "speech.started",
    EVENT_STOPPED = "speech.stopped",
    EVENT_RECEIVED = "speech.received",
}