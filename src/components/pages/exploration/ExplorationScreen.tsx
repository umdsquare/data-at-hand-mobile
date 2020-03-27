import React from "react";
import { StatusBar, View, StyleSheet, Platform, BackHandler, Alert, AppState, AppStateStatus } from "react-native";
import Colors from "@style/Colors";
import { StyleTemplates } from "@style/Styles";
import { ThunkDispatch } from "redux-thunk";
import { ReduxAppState } from "@state/types";
import { connect } from "react-redux";
import { BottomBar } from "@components/pages/exploration/parts/main/BottomBar";
import { ExplorationViewHeader } from '@components/pages/exploration/parts/header';
import { explorationInfoHelper } from "@core/exploration/ExplorationInfoHelper";
import { DataServiceManager } from "@measure/DataServiceManager";
import { ExplorationInfo, ExplorationType, ExplorationMode } from "@core/exploration/types";
import { startLoadingForInfo } from "@state/exploration/data/reducers";
import { ExplorationAction, InteractionType, createGoToBrowseOverviewAction, createRestorePreviousInfoAction, goBackAction } from "@state/exploration/interaction/actions";
import { Button } from "react-native-elements";
import { Sizes } from "@style/Sizes";
import { OverviewMainPanel } from "@components/pages/exploration/parts/main/OverviewMainPanel";
import { BrowseRangeMainPanel } from "@components/pages/exploration/parts/main/BrowseRangeMainPanel";
import { BusyHorizontalIndicator } from "@components/exploration/BusyHorizontalIndicator";
import { getIntraDayMainPanel } from "@components/pages/exploration/parts/main/IntraDayMainPanel";
import { CyclicComparisonMainPanel } from "@components/pages/exploration/parts/main/CyclicComparisonMainPanel";
import { MultiRangeComparisonMainPanel } from "@components/pages/exploration/parts/main/MultiRangeComparisonMainPanel";
import { FilteredDatesChartMainPanel } from "@components/pages/exploration/parts/main/FilteredDatesChartMainPanel";
import { ComparisonInitPanel } from "@components/pages/exploration/parts/main/ComparisonInitPanel";
import { TooltipOverlay } from "@components/pages/exploration/parts/main/TooltipOverlay";
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import { GlobalSpeechOverlay } from "@components/pages/exploration/parts/main/GlobalSpeechOverlay";
import Haptic from "react-native-haptic-feedback";
import { startSpeechSession, requestStopDictation, makeNewSessionId } from "@state/speech/commands";
import { SvgIcon, SvgIconType } from "@components/common/svg/SvgIcon";
import { ZIndices } from "@components/pages/exploration/parts/zIndices";
import { DataBusyOverlay } from "@components/pages/exploration/parts/main/DataBusyOverlay";
import { InitialLoadingIndicator } from "@components/pages/exploration/parts/main/InitialLoadingIndicator";
import { createSetShowGlobalPopupAction } from "@state/speech/actions";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@components/Routes";
import { SpeechContextHelper } from "@core/speech/nlp/context";
import { test } from "@core/speech/nlp/preprocessor";
import { TouchSafeBottomSheet } from "@components/common/TouchSafeBottomSheet";
import { Subscription } from "rxjs";
import { SpeechEventQueue } from "@core/speech/SpeechEventQueue";
import { SpeechEventNotificationOverlay } from "@components/pages/exploration/SpeechEventNotificationOverlay";
import { SystemLogger } from "@core/logging/SystemLogger";
import { sleep } from "@utils/utils";

test().then()

const styles = StyleSheet.create({

    headerContainerStyle: {
        backgroundColor: Colors.headerBackground,
        zIndex: ZIndices.Header,
        elevation: 7
    },

    mainContainerStyle: {
        ...StyleTemplates.screenDefaultStyle,
        backgroundColor: "#EFEFF4",
        zIndex: Platform.OS === 'android' ? 50 : undefined,
    },

    historyPanelStyle: {
        position: 'absolute',
        right: Sizes.horizontalPadding - 4,
        bottom: Sizes.horizontalPadding,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'flex-end'
    },

    historyButtonStyle: {
        borderRadius: 50,
        height: 38, padding: 0,
        backgroundColor: Colors.primary + "ee",
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 3,
        paddingLeft: 8,
        paddingRight: 16
    },

    historyButtonContainerStyle: {
        paddingLeft: 4,
        paddingRight: 4
    },

    historyButtonTitleStyle: {
        fontSize: Sizes.smallFontSize,
        color: 'white',
        fontWeight: 'bold'
    }
})

const undoIconStyle = <SvgIcon type={SvgIconType.Reset} size={20} color={'white'} />


export interface ExplorationProps {
    navigation: StackNavigationProp<RootStackParamList, 'Exploration'>,
    explorationInfo: ExplorationInfo,
    isUndoAvailable: boolean,
    backNavStackSize: number,
    loadedDataInfo: ExplorationInfo,
    isDataLoading: boolean,
    selectedServiceKey: string,
    showGlobalSpeechPopup: boolean,
    dispatchCommand: (command: ExplorationAction) => void,
    dispatchDataReload: (info: ExplorationInfo) => void,
    dispatchStartSpeechSession: (sessionId: string, currentExplorationType: ExplorationType) => void,
    dispatchFinishDictation: (sessionId: string) => void,
    dispatchSetShowGlobalPopup: (value: boolean, sessionId: string) => void
}

interface State {
    appState: AppStateStatus,
    initialLoadingFinished: boolean,
    loadingMessage: string,
    globalSpeechSessionId: string,
    undoIgnored: boolean,
    isInPermissionPhase: boolean
}


class ExplorationScreen extends React.PureComponent<ExplorationProps, State> {

    private comparisonBottomSheetRef = React.createRef<TouchSafeBottomSheet>()
    private speechUndoButtonRef = React.createRef<Button>()

    private speechFeedbackRef = React.createRef<SpeechEventNotificationOverlay>()

    private undoHideTimeout: NodeJS.Timeout | null = null

    private readonly subscriptions = new Subscription()

    private onAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            console.log('App has come to the foreground!');
            if (this.state.isInPermissionPhase === false) {
                this.checkPermission()
            }
        }
        this.setState({ appState: nextAppState });
    }

    private onHardwareBackPress = () => {
        if (this.props.backNavStackSize > 0) {
            this.props.dispatchCommand(goBackAction())
            return true
        } else return false
    }

    constructor(props: ExplorationProps) {
        super(props)
        this.state = {
            appState: AppState.currentState,
            initialLoadingFinished: false,
            loadingMessage: null,
            globalSpeechSessionId: null,
            undoIgnored: false,
            isInPermissionPhase: false
        }
    }

    private forwardUserToPermissionSettings(title: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            Alert.alert(title, content, [
                {
                    text: "Open settings",
                    onPress: async () => {
                        await openSettings()
                        resolve()
                    }
                }
            ], {
                cancelable: false
            })
        })
    }

    private async checkPermission(): Promise<boolean> {
        //permissions
        if (Platform.OS === 'ios') {

            let [microphonePermissionStatus, speechRecognitionPermissionStatus] = await Promise.all([PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.IOS.SPEECH_RECOGNITION].map(p => check(p)))

            console.log("micro:", microphonePermissionStatus, "speech:", speechRecognitionPermissionStatus)
            if (microphonePermissionStatus === RESULTS.GRANTED && speechRecognitionPermissionStatus === RESULTS.GRANTED) {
                console.log("All required permissions are met.")
                return true
            } else if (microphonePermissionStatus === RESULTS.BLOCKED && speechRecognitionPermissionStatus === RESULTS.BLOCKED) {
                console.log("Both permissions are blocked.")
                await this.forwardUserToPermissionSettings('Permissions required', "Please grant permission for microphone and speech recognition in the settings.")
                return false
            } else {
                if (microphonePermissionStatus === RESULTS.BLOCKED) {
                    console.log("Microphone permission is blocked.")
                    await this.forwardUserToPermissionSettings('Microphone permission required', "Please grant permission for the microphone access.")
                    return false
                } else if (microphonePermissionStatus !== RESULTS.GRANTED && microphonePermissionStatus !== RESULTS.UNAVAILABLE) {
                    microphonePermissionStatus = await request(PERMISSIONS.IOS.MICROPHONE)
                }

                if (speechRecognitionPermissionStatus === RESULTS.BLOCKED) {
                    console.log("Speech recognition permission is blocked.")
                    await this.forwardUserToPermissionSettings('Speech recognition permission required', "Please grant permission for speech recognition.")
                    return false
                } else if (speechRecognitionPermissionStatus !== RESULTS.GRANTED && speechRecognitionPermissionStatus !== RESULTS.UNAVAILABLE) {
                    speechRecognitionPermissionStatus = await request(PERMISSIONS.IOS.SPEECH_RECOGNITION)
                }

                if (microphonePermissionStatus === RESULTS.GRANTED && speechRecognitionPermissionStatus === RESULTS.GRANTED) {
                    console.log("All required permissions are met.")
                    return true
                } else {
                    return this.checkPermission()
                }
            }
        }else if(Platform.OS === 'android') {
            let audioRecordPermissionStatus = await check(PERMISSIONS.ANDROID.RECORD_AUDIO)

            if(audioRecordPermissionStatus === RESULTS.GRANTED){
                return true
            }else if(audioRecordPermissionStatus === RESULTS.DENIED){
                audioRecordPermissionStatus = await request(PERMISSIONS.ANDROID.RECORD_AUDIO)
                return this.checkPermission()
            }else if(audioRecordPermissionStatus === RESULTS.BLOCKED){
                await this.forwardUserToPermissionSettings('Speech recognition permission required', "Please grant permission for speech recognition.")
                return false
            }
            
        }
    }

    async componentDidMount() {
        console.log("Component was mount.")

        this.subscriptions.add(SpeechEventQueue.instance.onNewEventPushed.subscribe(
            (event) => {
                this.speechFeedbackRef.current?.notify(event)
            },
            () => {

            }, () => {

            }))

        AppState.addEventListener('change', this.onAppStateChange)

        BackHandler.addEventListener('hardwareBackPress', this.onHardwareBackPress)

        this.setState({
            ...this.state,
            isInPermissionPhase: true
        })
        const permissionPassed = await this.checkPermission()
        this.setState({
            ...this.state,
            isInPermissionPhase: false
        })
        if (permissionPassed === true) {
            console.log("All permissions are granted. Proceed to activation..")
            if (Platform.OS === 'ios') {
                console.log("App is currently not in foregroud. Defer the activation to the app state listener.")
                while (AppState.currentState !== 'active') {
                    await sleep(100)
                }
                console.log("Okay now the app is in foregroud. Try activation now.")
                await this.activateCurrentService()
            } else {
                await this.activateCurrentService()
            }
        } else {
            console.log("Not all permissions are granted.")
        }
    }

    private async activateCurrentService() {
        try {
            const serviceActivationResult = await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).activateInSystem((progressInfo) => {
                this.setState({
                    ...this.state,
                    loadingMessage: progressInfo.message
                })
            })
            if (serviceActivationResult.success == true) {
                this.setState({
                    ...this.state,
                    loadingMessage: null
                })
                console.log("activated ", this.props.selectedServiceKey, "successfully.")
                this.props.dispatchDataReload(this.props.explorationInfo)
            }
        } catch (error) {
            console.log("service activation error: ", this.props.selectedServiceKey, error)
        }

        this.setState({
            ...this.state,
            initialLoadingFinished: true
        });
    }

    async componentDidUpdate(prevProps: ExplorationProps, prevState: State) {

        let dataReloadNeeded = false

        const isExplorationInfoChanged = explorationInfoHelper.equals(prevProps.explorationInfo, this.props.explorationInfo) === false

        if (this.props.explorationInfo.type !== prevProps.explorationInfo.type || isExplorationInfoChanged === true) {
            if (this.state.initialLoadingFinished === true) {
                dataReloadNeeded = true
            }
        }

        if (this.props.selectedServiceKey !== prevProps.selectedServiceKey) {
            dataReloadNeeded = true
        }

        if (dataReloadNeeded === true) {
            console.log("should reload data")
            this.props.dispatchDataReload(this.props.explorationInfo)
        }

        if (isExplorationInfoChanged === true && this.props.isUndoAvailable) {
            //new undoable condition
            requestAnimationFrame(() => {
                this.setState({
                    ...this.state,
                    undoIgnored: false
                })
                if (this.undoHideTimeout) {
                    clearTimeout(this.undoHideTimeout)
                }
                this.undoHideTimeout = setTimeout(() => {
                    this.setState({
                        ...this.state,
                        undoIgnored: true
                    }),
                        this.undoHideTimeout = null
                }, 8000)
            })
        }
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.onAppStateChange)
        BackHandler.removeEventListener("hardwareBackPress", this.onHardwareBackPress)
        this.subscriptions.unsubscribe()
    }

    onBottomBarButtonPress = (mode: ExplorationMode) => {
        switch (mode) {
            case ExplorationMode.Browse:
                this.props.dispatchCommand(createGoToBrowseOverviewAction(InteractionType.TouchOnly))
                break;
            case ExplorationMode.Compare:
                this.comparisonBottomSheetRef.current?.open()
                break;
        }
    }

    undo = () => {
        console.log("undo speech command")
        this.props.dispatchCommand(createRestorePreviousInfoAction())
    }

    onGlobalSpeechInputPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })

        const sessionId = makeNewSessionId()
        this.props.dispatchSetShowGlobalPopup(true, sessionId)
        this.props.dispatchStartSpeechSession(sessionId, this.props.explorationInfo.type)

        this.setState({
            ...this.state,
            globalSpeechSessionId: sessionId
        })
    }

    onGlobalSpeechInputPressOut = () => {

        this.props.dispatchFinishDictation(this.state.globalSpeechSessionId)
        this.props.dispatchSetShowGlobalPopup(false, this.state.globalSpeechSessionId)

        this.setState({
            ...this.state,
            globalSpeechSessionId: null
        })
    }

    render() {

        return <View style={StyleTemplates.screenDefaultStyle}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBackground} />
            <View style={styles.headerContainerStyle}>
                <ExplorationViewHeader />
            </View>
            <View style={styles.mainContainerStyle}>
                {/* main data panel ===================================================================*/}

                {
                    this.props.isDataLoading === true && <BusyHorizontalIndicator />
                }

                {
                    this.props.loadedDataInfo != null ?
                        this.makeMainPanel(this.props.loadedDataInfo.type) : <></>
                }

                {/* history panel ===================================================================*/}
                {this.props.isUndoAvailable === true && this.state.undoIgnored === false && <View style={styles.historyPanelStyle}>
                    <Button
                        ref={this.speechUndoButtonRef}
                        key="undo"
                        containerStyle={styles.historyButtonContainerStyle}
                        buttonStyle={styles.historyButtonStyle}
                        icon={undoIconStyle} onPress={this.undo}
                        title="Cancel latest"
                        titleStyle={styles.historyButtonTitleStyle}
                    />
                </View>
                }

            </View>

            <BottomBar mode={explorationInfoHelper.getMode(this.props.explorationInfo)}
                onModePress={this.onBottomBarButtonPress}
                onVoiceButtonPressIn={this.onGlobalSpeechInputPressIn}
                onVoiceButtonPressOut={this.onGlobalSpeechInputPressOut}
            />

            <TouchSafeBottomSheet ref={this.comparisonBottomSheetRef}>
                <ComparisonInitPanel info={this.props.explorationInfo} onCompleted={() => { this.comparisonBottomSheetRef.current?.close() }} />
            </TouchSafeBottomSheet>

            <TooltipOverlay />
            <GlobalSpeechOverlay isGlobalSpeechButtonPressed={this.props.showGlobalSpeechPopup} />

            <DataBusyOverlay isBusy={this.props.isDataLoading === true || this.state.initialLoadingFinished === false} />
            {
                this.state.initialLoadingFinished === false ? <InitialLoadingIndicator loadingMessage={this.state.loadingMessage} /> : <></>
            }

            <SpeechEventNotificationOverlay ref={this.speechFeedbackRef} />
        </View>
    }

    makeMainPanel(type: ExplorationType): any {
        switch (type) {
            case ExplorationType.B_Overview:
                return <OverviewMainPanel />
            case ExplorationType.B_Range:
                return <BrowseRangeMainPanel />
            case ExplorationType.B_Day:
                return getIntraDayMainPanel(this.props.loadedDataInfo)
            case ExplorationType.C_Cyclic:
                return <CyclicComparisonMainPanel />
            case ExplorationType.C_TwoRanges:
                return <MultiRangeComparisonMainPanel />
            case ExplorationType.C_CyclicDetail_Range:
                return <MultiRangeComparisonMainPanel />
            case ExplorationType.C_CyclicDetail_Daily:
                return <FilteredDatesChartMainPanel />
        }
    }
}



function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        dispatchCommand: (command: ExplorationAction) => dispatch(command),
        dispatchDataReload: (info: ExplorationInfo) => dispatch(startLoadingForInfo(info)),
        dispatchStartSpeechSession: (sessionId, currentExplorationType) => dispatch(startSpeechSession(sessionId, SpeechContextHelper.makeGlobalContext(currentExplorationType))),
        dispatchFinishDictation: (sessionId) => dispatch(requestStopDictation(sessionId)),
        dispatchSetShowGlobalPopup: (value, sessionId) => dispatch(createSetShowGlobalPopupAction(value, sessionId))
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        explorationInfo: appState.explorationState.info,
        backNavStackSize: appState.explorationState.backNavStack.length,
        isUndoAvailable: appState.explorationState.prevInfo != null,
        loadedDataInfo: appState.explorationDataState.info,
        isDataLoading: appState.explorationDataState.isBusy,
        selectedServiceKey: appState.settingsState.serviceKey,
        showGlobalSpeechPopup: appState.speechRecognizerState.showGlobalPopup
    }
}

const explorationScreen = connect(mapStateToProps, mapDispatchToProps)(ExplorationScreen)
export { explorationScreen as ExplorationScreen }