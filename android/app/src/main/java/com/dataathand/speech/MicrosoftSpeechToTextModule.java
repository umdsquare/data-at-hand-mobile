package com.dataathand.speech;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.microsoft.cognitiveservices.speech.SpeechConfig;
import com.microsoft.cognitiveservices.speech.SpeechRecognizer;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import com.microsoft.cognitiveservices.speech.audio.AudioStreamFormat;
import com.microsoft.cognitiveservices.speech.audio.PullAudioInputStreamCallback;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

//The implementation was inspired by https://github.com/f111fei/react-native-microsoft-speech/blob/master/android/src/main/java/com/reactnative/ms/SpeechModule.java

public class MicrosoftSpeechToTextModule extends ASpeechToTextModule {

    static final String TAG = "MicrosoftSpeech";

    private static ExecutorService s_executorService;
    static {
        s_executorService = Executors.newCachedThreadPool();
    }

    private SpeechConfig config = null;

    private SpeechRecognizer currentRecognizer = null;

    private MicrophoneStream microphoneStream;

    private MicrophoneStream createMicrophoneStream() {
        if (microphoneStream != null) {
            microphoneStream.close();
            microphoneStream = null;
        }

        microphoneStream = new MicrophoneStream();
        return microphoneStream;
    }

    private String accumulatedTextToPrevCycle = null;
    private String currentCycleRecognizedText = null;

    @NonNull
    @Override
    public String getName() {
        return "AndroidMicrosoftSpeechToText";
    }

    MicrosoftSpeechToTextModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @ReactMethod
    public void install(@Nullable final ReadableMap args, final Promise promise) {
        super.install(args, promise);
    }

    @ReactMethod
    public void uninstall(Promise promise){

    }

    @Override
    protected void installWithArguments(@Nullable ReadableMap args) throws Exception {

        Log.d(TAG, "Try installing Microsoft Speech service.");

        String subscriptionId, region;

        try {
            assert args != null;
            subscriptionId = args.getString("subscriptionId");
            assert subscriptionId != null;
            region = args.getString("region");
            assert region != null;


            Log.d(TAG, "Microsoft Speech Service subscription id: " + subscriptionId + ", region: " + region);

            final SpeechConfig config = SpeechConfig.fromSubscription(subscriptionId, region);

            //config.enableDictation();
            config.setSpeechRecognitionLanguage("en-US");

            this.config = config;
        }catch( NullPointerException ex){
            throw new Exception("CredentialInvalid");
        }

    }

    @Override
    @ReactMethod
    public void isAvailableInSystem(Promise promise) {
        Log.d(TAG, "Check availability of Microsoft Speech service.");
        promise.resolve(true);
    }

    @Override
    @ReactMethod
    public void start(Promise promise) {
        Log.d(TAG, "Start speech recognition.");
        if(this.currentRecognizer!=null){
            this.currentRecognizer.close();
            this.currentRecognizer = null;
        }

        this.currentCycleRecognizedText = null;
        this.accumulatedTextToPrevCycle = null;

        final AudioConfig audioInput = AudioConfig.fromStreamInput(createMicrophoneStream());
        final SpeechRecognizer recognizer = new SpeechRecognizer(this.config, audioInput);

        recognizer.sessionStarted.addEventListener((o, eventArgs)->{
            Log.d(TAG, "Session started");
            emitStartEvent();
        });

        recognizer.sessionStopped.addEventListener((o, eventArgs)->{
            Log.d(TAG, "Session stopped");
            emitStopEvent(null);
        });

        recognizer.recognizing.addEventListener((o, eventArgs)->{
            final String s = eventArgs.getResult().getText();
            final String stitchedResult = joinTexts(accumulatedTextToPrevCycle, s);
            currentCycleRecognizedText = s;
            emitReceivedEvent(stitchedResult);
        });

        recognizer.recognized.addEventListener((o, eventArgs)->{
            final String s = eventArgs.getResult().getText();
            accumulatedTextToPrevCycle = joinTexts(accumulatedTextToPrevCycle, currentCycleRecognizedText);
        });

        final Future<Void> startTask = recognizer.startContinuousRecognitionAsync();

        this.currentRecognizer = recognizer;

        promise.resolve(true);
    }

    @Override
    @ReactMethod
    public void stop(Promise promise) {
        Log.d(TAG, "Request stop recognition.");
        if(this.currentRecognizer != null){
            try{
                this.currentRecognizer.stopContinuousRecognitionAsync().get();
                this.currentRecognizer.close();
                this.currentRecognizer = null;

                this.currentCycleRecognizedText = null;
                this.accumulatedTextToPrevCycle = null;

                if(this.microphoneStream!=null) {
                    this.microphoneStream.close();
                    this.microphoneStream = null;
                }

                promise.resolve(true);
            }catch(Exception e){
                promise.reject(e);
            }
        }else {
            promise.resolve(true);
        }
    }


    //Handlers ==========
    private void onSessionStarted(){

    }

    private void onStopped(){

    }
}

//Forked from https://github.com/microsoft/botframework-solutions/blob/master/samples/android/clients/VirtualAssistantClient/directlinespeech/src/main/java/com/microsoft/bot/builder/solutions/directlinespeech/MicrophoneStream.java
class MicrophoneStream extends PullAudioInputStreamCallback {

    // CONSTANTS
    private final static int SAMPLE_RATE = 16000;

    // STATE
    private final AudioStreamFormat format;
    private AudioRecord recorder;

    public MicrophoneStream() {
        this.format = AudioStreamFormat.getWaveFormatPCM(SAMPLE_RATE, (short)16, (short)1);
        this.initMic();
    }

    public AudioStreamFormat getFormat() {
        return this.format;
    }

    @Override
    public int read(byte[] bytes) {
        long ret = this.recorder.read(bytes, 0, bytes.length);
        return (int)ret;
    }

    @Override
    public void close() {
        this.recorder.release();
        this.recorder = null;
    }

    private void initMic() {
        // Note: currently, the Speech SDK support 16 kHz sample rate, 16 bit samples, mono (single-channel) only.
        if(Build.VERSION.SDK_INT >= 23) {
            AudioFormat af = new AudioFormat.Builder()
                    .setSampleRate(SAMPLE_RATE)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                    .build();

            this.recorder = new AudioRecord.Builder()
                    .setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                    .setAudioFormat(af)
                    .build();
        }else{
            this.recorder = new AudioRecord(
                    MediaRecorder.AudioSource.VOICE_RECOGNITION,
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    AudioRecord.getMinBufferSize(SAMPLE_RATE,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT));
        }

        this.recorder.startRecording();
    }
}
