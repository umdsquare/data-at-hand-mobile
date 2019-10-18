import {
  voiceDictator
} from './VoiceDictator';
import {sleep} from '../utils';
import { DictationResult } from './types';
import { naturalLanguageRecognizer } from './NaturalLanguageRecognizer';

const MIN_STATUS_DURATION = 500;

export enum TerminationReason {
  Success,
  Fail,
  Cancel,
}

export interface TerminationPayload {
  reason: TerminationReason;
  data: any;
}

export enum SessionStatus {
  Idle = 0,
  Starting = 1,
  Listening = 2,
  Analyzing = 3,
  Exiting = 4,
  Terminated = 5,
}

export class SpeechCommandSession {

  private _status: SessionStatus = SessionStatus.Idle;
  public get status(): SessionStatus {
    return this._status;
  }

  private statusUpdatedAt: number;

  private previousDictationResult: DictationResult = null;
  private lastDictationResult: DictationResult = null;

  constructor(
    private statusChangeListener: (status: SessionStatus, payload: any) => void,
    private dictationOutputListener: (output: DictationResult) => void,
  ) {
    voiceDictator.registerStartEventListener(() => {
      this.changeStatus(SessionStatus.Listening);
    });

    voiceDictator.registerReceivedEventListener(result => {
      this.previousDictationResult = this.lastDictationResult;
      this.lastDictationResult = result;

      //calculate diff
      if (this.previousDictationResult) {
        const Diff = require('diff');
        result = {
          ...result,
          diffResult: Diff.diffWords(
            this.previousDictationResult.text,
            this.lastDictationResult.text,
          ),
        };
      }
      this.dictationOutputListener(result);
    });

    voiceDictator.registerStopEventListener(async error => {
      if (error) {
        await this.waitForMinDuration();
        this.changeStatus(SessionStatus.Terminated, {
          reason: TerminationReason.Fail,
        } as TerminationPayload);
      } else {
        //TODO go to Analyzing session.
        //TODO for now, we don't have an analzer. Just sleep and finish.
        this.changeStatus(SessionStatus.Analyzing);
        const analyzed = await naturalLanguageRecognizer.process(this.lastDictationResult.text)
        console.log("analyzed:", JSON.stringify(analyzed))
        this.changeStatus(SessionStatus.Exiting);
        await sleep(1000);
        this.changeStatus(SessionStatus.Terminated, {
          reason: TerminationReason.Success,
        } as TerminationPayload);
      }
    });
  }

  async requestStart() {
    this.changeStatus(SessionStatus.Starting);
    const success = await voiceDictator.start();
    if (success === true) {
    } else {
      await this.waitForMinDuration();
      this.changeStatus(SessionStatus.Terminated, {
        reason: TerminationReason.Cancel,
      } as TerminationPayload);
    }
  }

  async requestStop() {
    const originalStatus = this.status;
    this.changeStatus(SessionStatus.Exiting);
    switch (originalStatus) {
      case SessionStatus.Idle:
        break;
      case SessionStatus.Starting:
      case SessionStatus.Listening:
        break;
      case SessionStatus.Analyzing:
      case SessionStatus.Exiting:
      case SessionStatus.Terminated:
        return;
    }

    await this.waitForMinDuration();
    this.changeStatus(SessionStatus.Terminated, {
      reason: TerminationReason.Cancel,
    } as TerminationPayload);
  }

  async requestStopListening() {
    if (this.status === SessionStatus.Listening) {
      await voiceDictator.stop();
    }
  }

  private async waitForMinDuration() {
    const remain = MIN_STATUS_DURATION - (Date.now() - this.statusUpdatedAt);
    if (remain > 0) {
      await sleep(remain);
    }
  }

  private changeStatus(to: SessionStatus, payload: any = null) {
    (this._status = to), (this.statusUpdatedAt = Date.now());
    this.statusChangeListener(to, payload);
  }

  /**
   * Don't forget to call it after use. It is automatically called when the session is finished.
   */
  dispose() {
    voiceDictator.uninstall();
  }
}
