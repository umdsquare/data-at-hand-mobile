import { EmitterSubscription, EventSubscription } from "react-native";
import { Subscription } from "rxjs";

export enum Command{
    DEFAULT_FALLBACK = "Default Fallback Intent"
}

export interface DictationResult{
    text: string,
    segments: Array<{text: string, confidence: number}>,
    diffResult?: Array<{value: string, added?: boolean, removed?: boolean}>
}

export interface IVoiceDictatorNative{
    install(): Promise<boolean>
    uninstall(): Promise<boolean>
    isAvailableInSystem(): Promise<boolean>
    registerStartEventListener(listener: ()=>void): EventSubscription
    registerReceivedEventListener(listener: (result: DictationResult) => void): EventSubscription
    registerStopEventListener(listener: (error: any)=>void): EventSubscription
    start(): Promise<boolean>
    stop(): Promise<boolean>
}

export enum VoiceDictatorStatus{
    INITIAL,
    INSTALLING,
    IDLE,
    STARTING,
    LISTENING,
    STOPPING,
}

export enum SpeechRecognitionEventType {
    EVENT_STARTED = "speech.started",
    EVENT_STOPPED = "speech.stopped",
    EVENT_RECEIVED = "speech.received",
}