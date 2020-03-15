import {
    NativeModules,
} from 'react-native';
import { AndroidDictatorImplBase } from './AndroidDictatorImplBase';

export class AndroidMicrosoftDictatorImpl extends AndroidDictatorImplBase {
    protected getInstallArgs(): { [key: string]: any; } | null {
        return require('@credentials/microsoft_cognitive_service_speech.json')
    }

    constructor() {
        super(NativeModules.AndroidMicrosoftSpeechToText)
    }

}
