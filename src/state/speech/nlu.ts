import { SpeechContext } from "./context"
import { Dispatch } from "redux"

export class NLUCommandResolver {

    private static _instance: NLUCommandResolver
    public static get instance() {
        if (this._instance == null) {
            this._instance = new NLUCommandResolver()
        }

        return this._instance
    }

    private constructor() { }

    async resolveSpeechCommand(speech: string, context: SpeechContext, dispatch: Dispatch): Promise<void>{
        return
    }
}