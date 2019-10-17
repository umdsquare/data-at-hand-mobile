import { IOSSpeechImpl } from "./IOSSpeechImpl";
import { Platform } from "react-native";

export interface DictationResult{
    text: string,
    segments: Array<{text: string, confidence: number}>,
    diffResult?: Array<{value: string, added?: boolean, removed?: boolean}>
}

export interface ISpeechRecognizer{
    install(): Promise<boolean>
    uninstall(): Promise<boolean>
    isAvailableInSystem(): Promise<boolean>
    registerStartEventListener(listener: ()=>void)
    registerReceivedEventListener(listener: (result: DictationResult) => void)
    registerStopEventListener(listener: (error)=>void)
    start(): Promise<boolean>
    stop(): Promise<boolean>
}


export enum SpeechRecognitionEventType {
    EVENT_STARTED = "speech.started",
    EVENT_STOPPED = "speech.stopped",
    EVENT_RECEIVED = "speech.received",
}

class SpeechRecognizer implements ISpeechRecognizer{

    private impl = {
        'ios': new IOSSpeechImpl(),
        'android': null
    }

    install(): Promise<boolean> {
        return this.impl[Platform.OS].install()
    }    
    
    isAvailableInSystem(): Promise<boolean> {
        return this.impl[Platform.OS].isAvailableInSystem()
    }

    registerStartEventListener(listener: () => void) {
        
        return this.impl[Platform.OS].registerStartEventListener(listener)
    }
    registerReceivedEventListener(listener: (result: DictationResult) => void) {
        
        return this.impl[Platform.OS].registerReceivedEventListener(listener)
    }
    registerStopEventListener(listener: (error) => void) {
        return this.impl[Platform.OS].registerStopEventListener(listener)
    }

    start(): Promise<boolean> {
        return this.impl[Platform.OS].start()
    }
    stop(): Promise<boolean> {
        return this.impl[Platform.OS].stop()
    }

    uninstall(): Promise<boolean> {
        return this.impl[Platform.OS].uninstall()
    }

}

export const speechRecognizer = new SpeechRecognizer()
