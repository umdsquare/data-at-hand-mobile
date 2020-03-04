import { TimeSpeechContext } from "./context";
import compromise from 'compromise';
var chrono = require('chrono-node');
import { Dispatch } from "redux";

export async function resolveTimeContextSpeech(speech: string, context: TimeSpeechContext, dispatch: Dispatch): Promise<void>{
    
    console.log("compromise:", JSON.stringify((compromise(speech) as any).dates().json()))
    console.log("chrono:", JSON.stringify(chrono.parse(speech)))
}