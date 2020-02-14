//
//  SpeechRecognitionManager.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 10/15/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Speech

@objc(SpeechRecognitionManager)
class SpeechRecognitionManager: RCTEventEmitter{
  
  let EVENT_STARTED = "speech.started"
  let EVENT_STOPPED = "speech.stopped"
  let EVENT_RECEIVED = "speech.received"
  
  @objc
  static override func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return [EVENT_STARTED, EVENT_STOPPED, EVENT_RECEIVED]
  }
  
  private let audioEngine = AVAudioEngine()
  private var currentRecognitionTask: SFSpeechRecognitionTask?
  private var currentRecognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  
  private var _speechRecognizer: SFSpeechRecognizer? = nil
  func getSpeechRecognizer() -> SFSpeechRecognizer{
    if(_speechRecognizer != nil){
      return _speechRecognizer!
    }else{
      _speechRecognizer = SFSpeechRecognizer.init(locale: Locale.init(identifier: "en-US"))
      _speechRecognizer?.defaultTaskHint = .confirmation
      return _speechRecognizer!
    }
  }
  
  @objc
  func install(_ callback: @escaping RCTResponseSenderBlock) -> Void{
    SFSpeechRecognizer.requestAuthorization { (status: SFSpeechRecognizerAuthorizationStatus) in
      switch status{
      case .authorized:
        callback([NSNull(), ["installed": true]])
        break;
      case .denied:
        callback([NSNull(), ["installed": false]])
        break;
      case .restricted:
        callback([NSNull(), ["installed": false]])
        break;
      case .notDetermined:
        callback([NSNull(), ["installed": false]])
        break;
      default:
        callback([NSNull(), ["installed": false]])
      }
    }
  }
  
  @objc
  func isAvailableInSystem(_ callback: RCTResponseSenderBlock) -> Void{
    let result: [String: Any] = ["available": getSpeechRecognizer().isAvailable]
    callback([NSNull(), result])
  }
  
  @objc
  func start(_ callback: RCTResponseSenderBlock) -> Void {
    currentRecognitionTask?.cancel()
    currentRecognitionTask = nil
    
    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    }
    catch {
      print("Audio session error")
      sendEvent(withName: self.EVENT_STOPPED, body: ["error": "AudioSessionFailed"])
      return;
    }
    let inputNode = audioEngine.inputNode
    
    currentRecognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    guard let currentRecognitionRequest = currentRecognitionRequest else { fatalError("Unable to create a SFSpeechAudioBufferRecognitionRequest object") }
    currentRecognitionRequest.shouldReportPartialResults = true
    
    if #available(iOS 13, *) {
      currentRecognitionRequest.requiresOnDeviceRecognition = false
    }
    
    currentRecognitionTask = getSpeechRecognizer().recognitionTask(with: currentRecognitionRequest){
      result, error in
      print("audiorecord recognition received: ")
      if result != nil {
        self.sendEvent(withName: self.EVENT_RECEIVED, body: [
          "text": result!.bestTranscription.formattedString,
          "segments": result!.bestTranscription.segments.map{ segment in
            return ["text": segment.substring, "confidence": segment.confidence, ]
          }
        ])
      }
      
      if error != nil || result?.isFinal == true {
        self.audioEngine.stop()
        inputNode.removeTap(onBus: 0)
        self.currentRecognitionRequest = nil
        self.currentRecognitionTask = nil
        
        if result?.isFinal == true {
          self.sendEvent(withName: self.EVENT_STOPPED, body: nil)
        }
        
        if error != nil {
          print("Recognition error:")
          print(error.debugDescription)
          self.sendEvent(withName: self.EVENT_STOPPED, body: [
            "error": error!.localizedDescription
          ])
        }
      }
      
    }
    
    // Configure the microphone input.
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer: AVAudioPCMBuffer, when: AVAudioTime) in
      self.currentRecognitionRequest?.append(buffer)
    }
    
    audioEngine.prepare()
    do {
      try audioEngine.start()
    } catch {
      sendEvent(withName: self.EVENT_STOPPED, body: ["error": "AudioStartFailed"])
      return
    }
    
    sendEvent(withName: self.EVENT_STARTED, body: nil)
    print("Speech recognition task started using microphone stream.")
  }
  
  @objc
  func stop(_ callback: RCTResponseSenderBlock) -> Void{
    if audioEngine.isRunning {
      audioEngine.stop()
      currentRecognitionRequest?.endAudio()
    }
  }
  
  
  
}
