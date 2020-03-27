package com.dataathand.speech;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public abstract class ASpeechToTextModule extends ReactContextBaseJavaModule {

    private static final String EVENT_STARTED = "speech.started";
    private static final String EVENT_STOPPED = "speech.stopped";
    private static final String EVENT_RECEIVED = "speech.received";
    private static final int DEFAULT_PERMISSION_REQUEST = 1224;
    private static ReactApplicationContext reactContext;
    private Promise installRequest = null;

    ASpeechToTextModule(ReactApplicationContext reactContext) {
        super(reactContext);
        ASpeechToTextModule.reactContext = reactContext;
    }

    static String joinTexts(@Nullable String left, @Nullable String right) {
        if (left == null && right == null) {
            return null;
        } else if (left != null && right == null) {
            return left;
        } else if (left == null && right != null) {
            return right;
        } else {
            return (left + " " + right).trim().replaceAll("\\s+", " ");
        }
    }

    protected abstract void installWithArguments(@Nullable final ReadableMap args) throws Exception;

    @ReactMethod
    public abstract void isAvailableInSystem(Promise promise);

    @ReactMethod
    public abstract void start(Promise promise);

    @ReactMethod
    public abstract void stop(Promise promise);

    @ReactMethod
    public abstract void uninstall(Promise promise);

    @SuppressWarnings("WeakerAccess")
    protected void postInstall() {
    }

    protected void emitStartEvent() {
        getDeviceEmitter().emit(EVENT_STARTED, null);
    }

    protected void emitStopEvent(@Nullable Object error) {
        if (error != null) {
            final WritableMap params = Arguments.createMap();
            if (error instanceof Integer) {
                params.putInt("error", (int) error);
            } else {
                params.putString("error", error.toString());
            }
            getDeviceEmitter().emit(EVENT_STOPPED, params);
        } else {
            getDeviceEmitter().emit(EVENT_STOPPED, null);
        }
    }

    protected void emitReceivedEvent(String text) {
        WritableMap resultParams = Arguments.createMap();
        resultParams.putString("text", text);
        getDeviceEmitter().emit(EVENT_RECEIVED, resultParams);
    }

    @ReactMethod
    public void install(@Nullable final ReadableMap args, final Promise promise) {
        boolean isPermissionGranted = false;

        try {
            installWithArguments(args);
            postInstall();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    DeviceEventManagerModule.RCTDeviceEventEmitter getDeviceEmitter() {
        return reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
    }
}
