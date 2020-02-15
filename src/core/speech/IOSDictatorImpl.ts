import {
  NativeModules,
  NativeEventEmitter,
  EventSubscription,
} from 'react-native';
import { IVoiceDictatorNative, DictationResult, SpeechRecognitionEventType } from './types';

export class IOSDictatorImpl implements IVoiceDictatorNative {
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

  registerStartEventListener(listener: () => void): EventSubscription {
    const subscription = this.iosEventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_STARTED,
      listener,
    )
    this.subscriptions.push(subscription);
    return subscription
  }

  registerReceivedEventListener(
    listener: (result: DictationResult) => void,
  ): EventSubscription {
    const subscription = this.iosEventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_RECEIVED,
      listener,
    )
    this.subscriptions.push(subscription);
    return subscription
  }

  registerStopEventListener(listener: (error) => void): EventSubscription {
    const subscription = this.iosEventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_STOPPED,
      listener,
    )
    this.subscriptions.push(subscription)
    return subscription
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
        if (error) {
          reject(error);
        } else resolve(true);
      });
    });
  }

  stop(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.iosBridge.stop((error, result) => {
        if (error) {
          console.log("IOS dictator stop error:", error)
          reject(error)
        } else resolve(true);
      });
    });
  }
}
