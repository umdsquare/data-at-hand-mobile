import {
  IVoiceDictatorNative,
  DictationResult,
  SpeechRecognitionEventType,
} from './types';
import {
  NativeEventEmitter,
  EventSubscription,
} from 'react-native';

export abstract class AndroidDictatorImplBase implements IVoiceDictatorNative {
  constructor(protected readonly bridge) { }

  private eventEmitter = new NativeEventEmitter(this.bridge);

  private subscriptions = new Array<EventSubscription>();

  protected abstract getInstallArgs(): { [key: string]: any } | null

  install(): Promise<boolean> {
    return this.bridge.install(this.getInstallArgs());
  }

  uninstall(): Promise<boolean> {
    return this.bridge.uninstall().then(new Promise(resolve => {
      this.subscriptions.forEach(s => s.remove());
      this.subscriptions = [];
      resolve(true);
    }));
  }
  isAvailableInSystem(): Promise<boolean> {
    return this.bridge.isAvailableInSystem();
  }
  registerStartEventListener(listener: () => void): EventSubscription {
    const subscription = this.eventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_STARTED,
      listener,
    )
    this.subscriptions.push(subscription);
    return subscription
  }

  registerReceivedEventListener(listener: (result: DictationResult) => void): EventSubscription {
    const subscription = this.eventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_RECEIVED,
      listener,
    )
    this.subscriptions.push(subscription);
    return subscription
  }
  registerStopEventListener(listener: (error: any) => void): EventSubscription {
    const subscription = this.eventEmitter.addListener(
      SpeechRecognitionEventType.EVENT_STOPPED,
      listener,
    )
    this.subscriptions.push(subscription);
    return subscription
  }

  start(): Promise<boolean> {
    return this.bridge.start()
  }

  stop(): Promise<boolean> {
    return this.bridge.stop()
  }
}
