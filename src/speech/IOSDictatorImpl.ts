import {
  NativeModules,
  NativeEventEmitter,
  EventSubscription,
} from 'react-native';
import { IVoiceDictator, DictationResult, SpeechRecognitionEventType } from './types';

export class IOSDictatorImpl implements IVoiceDictator {
  private iosBridge = NativeModules.SpeechRecognitionManager;
  private iosEventEmitter = new NativeEventEmitter(this.iosBridge);

  private subscriptions = new Array<EventSubscription>();

  install(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.iosBridge.install((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.installed);
        }
      });
    });
  }

  isAvailableInSystem(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.iosBridge.isAvailableInSystem((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.available);
        }
      });
    });
  }

  registerStartEventListener(listener: () => void) {
    this.subscriptions.push(
      this.iosEventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_STARTED,
        listener,
      ),
    );
  }

  registerReceivedEventListener(
    listener: (result: DictationResult) => void,
  ) {
    this.subscriptions.push(
      this.iosEventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_RECEIVED,
        listener,
      ),
    );
  }

  registerStopEventListener(listener: (error) => void) {
    this.subscriptions.push(
      this.iosEventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_STOPPED,
        listener,
      ),
    );
  }

  uninstall(): Promise<boolean> {
    return new Promise(resolve => {
      this.subscriptions.forEach(s => s.remove());
      this.subscriptions = []
      resolve(true);
    });
  }

  start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.iosBridge.start((error, result) => {
        resolve(true);
      });
    });
  }

  stop(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.iosBridge.stop((error, result) => {
        resolve(true);
      });
    });
  }
}
