package com.dataathand.speech;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.List;

;

public class DefaultSpeechToTextModule extends ASpeechToTextModule implements RecognitionListener {

    private SpeechRecognizer recognizer = null;

    private final Intent speechIntent;

    private boolean hasResultReceived = false;
    private Integer pendingError = null;

    private boolean isRunning = false;

    private boolean isStartOver = false;
    private int startOverCycle = 0;
    private String accumulatedTextToPrevCycle = null;
    private String currentCycleRecognizedText = null;

    @NonNull
    @Override
    public String getName() {
        return "AndroidDefaultSpeechToText";
    }

    DefaultSpeechToTextModule(ReactApplicationContext reactContext) {
        super(reactContext);

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en_US");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en_US");

        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 10000);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 10000);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 20000);

        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);

        speechIntent = intent;
    }

    @Override
    @ReactMethod
    public void isAvailableInSystem(Promise promise) {
        promise.resolve(SpeechRecognizer.isRecognitionAvailable(getCurrentActivity()));
    }

    @Override
    protected void installWithArguments(@Nullable ReadableMap args) throws Exception {
    }

    @Override
    @ReactMethod
    public void start(Promise promise) {
        this.isRunning = true;
        Activity activity = getCurrentActivity();
        if(activity != null) {
            getCurrentActivity().runOnUiThread(() -> {
                    hasResultReceived = false;
                    pendingError = null;

                    AudioManager audioManager = (AudioManager)getReactApplicationContext().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);

                    if(Build.VERSION.SDK_INT >= 23) {
                        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0);
                        audioManager.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_MUTE, 0);
                    }else{
                        audioManager.setStreamMute(AudioManager.STREAM_MUSIC, true);
                        audioManager.setStreamMute(AudioManager.STREAM_SYSTEM, true);
                    }


                    startOver(false);

                    Log.d("Speech", "Start requested.");
                    promise.resolve(true);
            });
        }else{
            promise.resolve(false);
        }
    }

    @Override
    @ReactMethod
    public void install(@Nullable final ReadableMap args, final Promise promise) {
        super.install(args, promise);
    }

    @ReactMethod
    public void uninstall(Promise promise){
        promise.resolve(true);
    }

    private void startOver(Boolean isStartOver){
        this.isStartOver = isStartOver;
        if(isStartOver){
            startOverCycle++;
            accumulatedTextToPrevCycle = joinTexts(accumulatedTextToPrevCycle, currentCycleRecognizedText);
        }

        if(recognizer!=null){
            recognizer.destroy();
        }
        pendingError = null;

        recognizer = SpeechRecognizer.createSpeechRecognizer(getCurrentActivity());
        recognizer.setRecognitionListener(DefaultSpeechToTextModule.this);

                /*
                if(Build.VERSION.SDK_INT >= 23){
                    intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                }*/

        recognizer.startListening(speechIntent);
    }

    @SuppressWarnings("WeakerAccess")
    @Override
    @ReactMethod
    public void stop(Promise promise) {
        isRunning = false;
        stopImpl(promise);
    }

    private void stopImpl(@Nullable Promise promise) {
        getCurrentActivity().runOnUiThread(() -> {
            try {
                if (recognizer != null) {
                    recognizer.destroy();
                    recognizer = null;
                    startOverCycle = 0;
                    isStartOver = false;
                    accumulatedTextToPrevCycle = null;
                    currentCycleRecognizedText = null;

                    Log.d("Speech", "Stop Requested.");

                    if (pendingError != null) {

                        switch (pendingError) {
                            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: {
                                emitStopEvent("SpeechTimeout");
                            }
                            default: {
                                emitStopEvent(pendingError);
                            }
                        }
                    } else if(hasResultReceived) {
                        emitStopEvent(null);
                    }else {
                        emitStopEvent("Retry");
                    }

                    if (promise != null) {
                        promise.resolve(true);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                Log.e("Speech", e.getLocalizedMessage());
                if (promise != null) {
                    promise.reject(e);
                }
            } finally {
                final Handler handler = new Handler();
                handler.postDelayed(() -> {
                        if(!isRunning) {
                            AudioManager audioManager = (AudioManager) getReactApplicationContext().getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
                            if(Build.VERSION.SDK_INT >= 23) {
                                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0);
                                audioManager.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_UNMUTE, 0);
                            }else{
                                audioManager.setStreamMute(AudioManager.STREAM_MUSIC, false);
                                audioManager.setStreamMute(AudioManager.STREAM_SYSTEM, false);
                            }
                        }
                }, 1000);
            }

        });
    }

    private void emitResults(Bundle results){
        hasResultReceived = true;

        List<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

        assert matches != null;
        float[] confidence = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);

        String recognizedText;
        if(accumulatedTextToPrevCycle != null){
            //append the prior result.
            recognizedText = joinTexts(accumulatedTextToPrevCycle, matches.get(0));
        }else{
            recognizedText = matches.get(0);
        }

        currentCycleRecognizedText = matches.get(0);

        emitReceivedEvent(recognizedText);

    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        stopImpl(null);
    }

    @Override
    public void onReadyForSpeech(Bundle params) {
        Log.d("Speech", "Ready of Speech");
        if(!isStartOver) {
            emitStartEvent();
        }
    }

    @Override
    public void onBeginningOfSpeech() {
        Log.d("Speech", "onBeginning of Speech");
    }

    @Override
    public void onRmsChanged(float rmsdB) {

    }

    @Override
    public void onBufferReceived(byte[] buffer) {

        Log.d("Speech", "on buffer");
    }

    @Override
    public void onEndOfSpeech() {
        Log.d("Speech", "on End of Speech");
        //stop(null);
        getCurrentActivity().runOnUiThread(() -> startOver(true));
    }

    @Override
    public void onError(int error) {
        Log.d("Speech", "on Error: " + error);
        pendingError = error;
        startOver(true);
    }

    @Override
    public void onResults(Bundle results) {

        Log.d("Speech", "on Result");
        emitResults(results);
    }

    @Override
    public void onPartialResults(Bundle partialResults) {
        Log.d("Speech", "on PartialResults");
        emitResults(partialResults);
    }

    @Override
    public void onEvent(int eventType, Bundle params) {

    }
}
