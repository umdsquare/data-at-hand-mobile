import { IOSDictatorImpl } from "./IOSDictatorImpl";
import { Platform } from "react-native";
import { AndroidDictatorImpl } from "./AndroidDictatorImpl";
import { DictationResult, VoiceDictatorStatus, IVoiceDictatorNative } from "./types";
import { BehaviorSubject, Observable } from "rxjs";

export class VoiceDictator {

    private static _instance: VoiceDictator
    static get instance(): VoiceDictator {
        if (this._instance == null) {
            this._instance = new VoiceDictator()
        }

        return this._instance
    }

    private voiceDictatorNative: IVoiceDictatorNative

    private constructor() {
        this.voiceDictatorNative = Platform.OS === 'ios' ? new IOSDictatorImpl() : new AndroidDictatorImpl()
    }

    private readonly statusSubject = new BehaviorSubject<VoiceDictatorStatus>(VoiceDictatorStatus.INITIAL)
    public get statusObservable(): Observable<VoiceDictatorStatus> {
        return this.statusSubject
    }

    private startEventListener: () => void = null
    private receivedEventListener: (result: DictationResult) => void = null
    private stopEventListener: (error: any) => void = null

    async install(): Promise<boolean> {
        this.statusSubject.next(VoiceDictatorStatus.INSTALLING)
        const installed = await this.voiceDictatorNative.install()

        if (installed === true) {

            this.voiceDictatorNative.registerReceivedEventListener((received) => {
                if (this.receivedEventListener) {
                    this.receivedEventListener(received)
                }
            })

            this.voiceDictatorNative.registerStartEventListener(() => {
                if (this.startEventListener) {
                    this.startEventListener()
                }
            })

            this.voiceDictatorNative.registerStopEventListener((error: any) => {
                if (this.stopEventListener) {
                    this.stopEventListener(error)
                }
            })

            this.statusSubject.next(VoiceDictatorStatus.IDLE)
            return true
        } else {
            this.statusSubject.next(VoiceDictatorStatus.INITIAL)
            return false
        }
    }

    async uninstall(): Promise<boolean> {
        return this.voiceDictatorNative.uninstall()
    }

    clearAllListeners() {
        this.startEventListener = null
        this.stopEventListener = null
        this.receivedEventListener = null
    }

    isAvailableInSystem(): Promise<boolean> {
        return this.voiceDictatorNative.isAvailableInSystem()
    }

    registerStartEventListener(listener: () => void) {
        this.startEventListener = listener
    }
    registerReceivedEventListener(listener: (result: DictationResult) => void) {
        this.receivedEventListener = listener
    }
    registerStopEventListener(listener: (error: any) => void) {
        this.stopEventListener = listener
    }

    async start(): Promise<boolean> {
        console.log("Start voice dictator.")
        this.statusSubject.next(VoiceDictatorStatus.STARTING)
        const started = await this.voiceDictatorNative.start()
        if (started === true) {
            this.statusSubject.next(VoiceDictatorStatus.LISTENING)
            return true
        } else {
            this.statusSubject.next(VoiceDictatorStatus.IDLE)
            return false
        }
    }
    async stop(): Promise<boolean> {
        this.statusSubject.next(VoiceDictatorStatus.STOPPING)
        const stopped = await this.voiceDictatorNative.stop()
        if (stopped === true) {
            this.statusSubject.next(VoiceDictatorStatus.IDLE)
            return true
        } else {
            this.statusSubject.next(VoiceDictatorStatus.LISTENING)
            return false
        }
    }

}