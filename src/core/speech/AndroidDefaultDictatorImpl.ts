import {
  NativeModules,
} from 'react-native';
import { AndroidDictatorImplBase } from './AndroidDictatorImplBase';

export class AndroidDictatorImpl extends AndroidDictatorImplBase {
  protected getInstallArgs(): { [key: string]: any; } | null {
    return null
  }

  constructor() {
    super(NativeModules.AndroidDefaultSpeechToText)
  }

}
