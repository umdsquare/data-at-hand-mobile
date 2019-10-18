import { IOSDictatorImpl } from "./IOSSpeechImpl";
import { Platform } from "react-native";
import { IVoiceDictator, DictationResult } from "./types";

class VoiceDictator implements IVoiceDictator{

    private impl = {
        'ios': new IOSDictatorImpl(),
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

export const voiceDictator = new VoiceDictator()
