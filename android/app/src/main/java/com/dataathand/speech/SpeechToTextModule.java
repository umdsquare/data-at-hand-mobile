package com.dataathand.speech;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class SpeechToTextModule extends ReactContextBaseJavaModule implements PermissionListener, RecognitionListener {

    private static final String EVENT_STARTED = "speech.started";
    private static final String EVENT_STOPPED = "speech.stopped";
    private static final String EVENT_RECEIVED = "speech.received";

    private static ReactApplicationContext reactContext;
    private static final int DEFAULT_PERMISSION_REQUEST = 1;

    private Promise installRequest = null;

    private SpeechRecognizer recognizer = null;

    private boolean hasResultReceived = false;
    private Integer pendingError = null;

    @NonNull
    @Override
    public String getName() {
        return "AndroidSpeechToText";
    }

    SpeechToTextModule(ReactApplicationContext reactContext) {
        super(reactContext);
        SpeechToTextModule.reactContext = reactContext;
    }

    @ReactMethod
    public void install(Promise promise) {
        boolean isPermissionGranted = false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            isPermissionGranted = true;
        } else {
            isPermissionGranted = ContextCompat.checkSelfPermission(Objects.requireNonNull(getCurrentActivity()), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        }

        if (isPermissionGranted) {
            promise.resolve(true);
        } else {
            this.installRequest = promise;
            getPermissionAwareActivity().requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, DEFAULT_PERMISSION_REQUEST, this);
        }
    }

    @ReactMethod
    public void isAvailableInSystem(Promise promise) {
        promise.resolve(SpeechRecognizer.isRecognitionAvailable(getCurrentActivity()));
    }

    @ReactMethod
    public void start(Promise promise) {
        getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                hasResultReceived = false;
                pendingError = null;

                recognizer = SpeechRecognizer.createSpeechRecognizer(getCurrentActivity());
                recognizer.setRecognitionListener(SpeechToTextModule.this);
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en");

                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 100000);
                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 100000);
                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 200000);

                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);

                /*
                if(Build.VERSION.SDK_INT >= 23){
                    intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                }*/

                recognizer.startListening(intent);

                Log.d("Speech", "Start requested.");
                promise.resolve(true);
            }
        });
    }

    @ReactMethod
    public void stop(Promise promise) {
        stopImpl(promise);
    }

    private void stopImpl(@Nullable Promise promise) {
        getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (recognizer != null) {
                        recognizer.destroy();
                        recognizer = null;

                        Log.d("Speech", "Stop Requested.");

                        if (pendingError != null) {

                            WritableMap params = Arguments.createMap();

                            switch (pendingError) {
                                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: {
                                    params.putString("error", "SpeechTimeout");
                                }
                                default: {
                                    params.putInt("error", pendingError);
                                }
                            }
                            getDeviceEmitter().emit(EVENT_STOPPED, params);
                        } else if(hasResultReceived) {
                            getDeviceEmitter().emit(EVENT_STOPPED, null);
                        }else {
                            WritableMap params = Arguments.createMap();
                            params.putString("error", "Retry");
                            getDeviceEmitter().emit(EVENT_STOPPED, params);
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
                }

            }
        });
    }

    private void emitResults(Bundle results){
        hasResultReceived = true;

        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        float[] confidence = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
        WritableMap resultParams = Arguments.createMap();
        resultParams.putString("text", matches.get(0));
        getDeviceEmitter().emit(EVENT_RECEIVED, resultParams);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        stopImpl(null);
    }

    private DeviceEventManagerModule.RCTDeviceEventEmitter getDeviceEmitter() {
        return reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
    }

    private PermissionAwareActivity getPermissionAwareActivity() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            throw new IllegalStateException("Tried to use permissions API while not attached to an Activity.");
        } else if (!(activity instanceof PermissionAwareActivity)) {
            throw new IllegalStateException("Tried to use permissions API but the host Activity doesn't implement PermissionAwareActivity.");
        }
        return (PermissionAwareActivity) activity;
    }

    @Override
    public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == DEFAULT_PERMISSION_REQUEST && installRequest != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                installRequest.resolve(true);
                installRequest = null;
            } else {
                installRequest.resolve(false);
                installRequest = null;
            }
        }

        return false;
    }

    @Override
    public void onReadyForSpeech(Bundle params) {

        Log.d("Speech", "Ready of Speech");
        getDeviceEmitter().emit(EVENT_STARTED, null);
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
        stop(null);
    }

    @Override
    public void onError(int error) {
        Log.d("Speech", "on Error: " + error);
        pendingError = error;
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
