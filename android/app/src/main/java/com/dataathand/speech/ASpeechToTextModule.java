package com.dataathand.speech;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.util.Objects;

public abstract class ASpeechToTextModule extends ReactContextBaseJavaModule implements PermissionListener {

    static String joinTexts(@Nullable String left, @Nullable String right){
        if(left == null && right == null){
            return null;
        }else if (left != null && right == null){
            return left;
        }else if(left == null && right != null){
            return right;
        }else{
            return (left + " " + right).trim().replaceAll("\\s+", " ");
        }
    }

    private static final String EVENT_STARTED = "speech.started";
    private static final String EVENT_STOPPED = "speech.stopped";
    private static final String EVENT_RECEIVED = "speech.received";

    private static ReactApplicationContext reactContext;

    private static final int DEFAULT_PERMISSION_REQUEST = 1224;

    private Promise installRequest = null;

    ASpeechToTextModule(ReactApplicationContext reactContext) {
        super(reactContext);
        ASpeechToTextModule.reactContext = reactContext;
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
    protected void postInstall(){}

    protected void emitStartEvent(){
        getDeviceEmitter().emit(EVENT_STARTED, null);
    }

    protected void emitStopEvent(@Nullable Object error){
        if(error != null){
            final WritableMap params = Arguments.createMap();
            if(error instanceof Integer){
                params.putInt("error", (int)error);
            }else{
                params.putString("error", error.toString());
            }
            getDeviceEmitter().emit(EVENT_STOPPED, params);
        }else{
            getDeviceEmitter().emit(EVENT_STOPPED, null);
        }
    }

    protected void emitReceivedEvent(String text){
        WritableMap resultParams = Arguments.createMap();
        resultParams.putString("text", text);
        getDeviceEmitter().emit(EVENT_RECEIVED, resultParams);
    }

    @ReactMethod
    public void install(@Nullable final ReadableMap args, final Promise promise) {
        boolean isPermissionGranted = false;

        try{
            installWithArguments(args);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                isPermissionGranted = true;
            } else {
                isPermissionGranted = ContextCompat.checkSelfPermission(Objects.requireNonNull(getCurrentActivity()), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            }

            if (isPermissionGranted) {
                postInstall();
                promise.resolve(true);
            } else {
                this.installRequest = promise;
                getPermissionAwareActivity().requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, DEFAULT_PERMISSION_REQUEST, this);
            }
        }catch (Exception e){
            promise.reject(e);
        }
    }

    DeviceEventManagerModule.RCTDeviceEventEmitter getDeviceEmitter() {
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
                postInstall();
                installRequest.resolve(true);
                installRequest = null;
            } else {
                installRequest.resolve(false);
                installRequest = null;
            }
        }

        return false;
    }
}
