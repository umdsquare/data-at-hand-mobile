import { SpeechContext, SpeechContextType, TimeSpeechContext } from "./context"
import { Dispatch } from "redux"

import compromise from 'compromise';
compromise.extend(require('compromise-numbers'))
compromise.extend(require('compromise-dates'))

import {resolveTimeContextSpeech} from './context_time';
import { preprocess } from "./preprocessor";

export class NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolver()
        }

        return this._instance
    }

    private constructor() { }

    async resolveSpeechCommand(speech: string, context: SpeechContext, dispatch: Dispatch): Promise<void> {
        const preprocessed = await preprocess(speech)
        console.log(preprocessed)
        if (speech != null && speech.length > 0) {
            switch(context.type){
                case SpeechContextType.Time:
                    await resolveTimeContextSpeech(speech, context as TimeSpeechContext, dispatch)
                break;
            }
            return
        } else return
    }
}