import {
  IVoiceDictator,
  DictationResult,
  SpeechRecognitionEventType,
} from './types';
import {
  NativeModules,
  NativeEventEmitter,
  EventSubscription,
} from 'react-native';

export class AndroidDictatorImpl implements IVoiceDictator {
  private bridge = NativeModules.AndroidSpeechToText;
  private eventEmitter = new NativeEventEmitter(this.bridge);

  private subscriptions = new Array<EventSubscription>();

  install(): Promise<boolean> {
    return this.bridge.install();
  }

  uninstall(): Promise<boolean> {
    return new Promise(resolve => {
      this.subscriptions.forEach(s => s.remove());
      this.subscriptions = [];
      resolve(true);
    });
  }
  isAvailableInSystem(): Promise<boolean> {
    return this.bridge.isAvailableInSystem();
  }
  registerStartEventListener(listener: () => void) {
    this.subscriptions.push(
      this.eventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_STARTED,
        listener,
      ),
    );
  }
  registerReceivedEventListener(listener: (result: DictationResult) => void) {
    this.subscriptions.push(
      this.eventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_RECEIVED,
        listener,
      ),
    );
  }
  registerStopEventListener(listener: (error: any) => void) {
    this.subscriptions.push(
      this.eventEmitter.addListener(
        SpeechRecognitionEventType.EVENT_STOPPED,
        listener,
      ),
    );
  }
  start(): Promise<boolean> {
      return this.bridge.start()
  }
  stop(): Promise<boolean> {
      return this.bridge.stop()
  }
}
