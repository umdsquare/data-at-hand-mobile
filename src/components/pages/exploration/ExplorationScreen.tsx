import { PropsWithNavigation } from "../../../PropsWithNavigation";
import React from "react";
import { StatusBar, View, StyleSheet, Platform, BackHandler, Text, Alert, AppState, AppStateStatus, Vibration } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
import { ExplorationState } from "../../../state/exploration/interaction/reducers";
import { ThunkDispatch } from "redux-thunk";
import { ReduxAppState } from "../../../state/types";
import { connect } from "react-redux";
import { BottomBar } from "./parts/main/BottomBar";
import { ExplorationViewHeader } from '../exploration/parts/header';
import { explorationInfoHelper } from "../../../core/exploration/ExplorationInfoHelper";
import { DataServiceManager } from "../../../system/DataServiceManager";
import { ExplorationInfo, ExplorationType, ExplorationMode } from "../../../core/exploration/types";
import { ExplorationDataState, startLoadingForInfo } from "../../../state/exploration/data/reducers";
import { ExplorationAction, InteractionType, createGoToBrowseOverviewAction, createRestorePreviousInfoAction, goBackAction } from "../../../state/exploration/interaction/actions";
import { Button } from "react-native-elements";
import { Sizes } from "../../../style/Sizes";
import { OverviewMainPanel } from "./parts/main/OverviewMainPanel";
import { BrowseRangeMainPanel } from "./parts/main/BrowseRangeMainPanel";
import { BusyHorizontalIndicator } from "../../exploration/BusyHorizontalIndicator";
import { getIntraDayMainPanel } from "./parts/main/IntraDayMainPanel";
import { CyclicComparisonMainPanel } from "./parts/main/CyclicComparisonMainPanel";
import { MultiRangeComparisonMainPanel } from "./parts/main/MultiRangeComparisonMainPanel";
import { FilteredDatesChartMainPanel } from "./parts/main/FilteredDatesChartMainPanel";
import { BottomSheet } from "../../common/BottomSheet";
import { ComparisonInitPanel } from "./parts/main/ComparisonInitPanel";
import { TooltipOverlay } from "./parts/main/TooltipOverlay";
import { check, PERMISSIONS, RESULTS, request, openSettings } from 'react-native-permissions';
import { GlobalSpeechOverlay } from "./parts/main/GlobalSpeechOverlay";
import Haptic from "react-native-haptic-feedback";
import { startSpeechSession, requestStopDictation, makeNewSessionId } from "../../../state/speech/commands";
import { SvgIcon, SvgIconType } from "../../common/svg/SvgIcon";
import { ZIndices } from "./parts/zIndices";
import { DataBusyOverlay } from "./parts/main/DataBusyOverlay";
import { sleep } from "../../../utils";
import { InitialLoadingIndicator } from "./parts/main/InitialLoadingIndicator";
import uuid from 'uuid/v4';
import { createSetShowGlobalPopupAction } from "../../../state/speech/actions";
import { SpeechContextHelper } from "../../../state/speech/context";

var deepEqual = require('deep-equal');

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

const undoIconStyle = <SvgIcon type={SvgIconType.Reset} size={20} />


export interface ExplorationProps extends PropsWithNavigation {
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState,
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
    globalSpeechSessionId: string
}


class ExplorationScreen extends React.Component<ExplorationProps, State> {

    private comparisonBottomSheetRef: BottomSheet

    private onAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            console.log('App has come to the foreground!');
            this.checkPermission()
        }
        this.setState({ appState: nextAppState });
    }

    private onHardwareBackPress = () => {
        if (this.props.explorationState.backNavStack.length > 0) {
            this.props.dispatchCommand(goBackAction())
            return true
        } else return false
    }

    constructor(props) {
        super(props)
        this.state = {
            appState: AppState.currentState,
            initialLoadingFinished: false,
            loadingMessage: null,
            globalSpeechSessionId: null
        }
    }

    private async checkPermission() {
        //permissions
        if (Platform.OS === 'ios') {
            const microphonePermissionStatus = await check(PERMISSIONS.IOS.MICROPHONE)
            console.log("Microphone permission:", microphonePermissionStatus)
            if (microphonePermissionStatus === RESULTS.BLOCKED) {
                console.log("Microphone permission is blocked.")
                Alert.alert('Microphone permission required', "Please grant permission for the microphone access.", [
                    {
                        text: "Open settings",
                        onPress: async () => {
                            await openSettings()
                            console.log("returned")
                        }
                    }
                ], {
                    cancelable: false
                })
            } else if (microphonePermissionStatus !== RESULTS.GRANTED && microphonePermissionStatus !== RESULTS.UNAVAILABLE) {
                const permissionRequestResult = await request(PERMISSIONS.IOS.MICROPHONE)
                if (permissionRequestResult !== RESULTS.UNAVAILABLE) {
                    await this.checkPermission()
                }
            }
        }
    }

    async componentDidMount() {

        AppState.addEventListener('change', this.onAppStateChange)

        BackHandler.addEventListener('hardwareBackPress', this.onHardwareBackPress)

        if (this.props.selectedServiceKey) {
            try {
                await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).activateInSystem((progressInfo) => {
                    this.setState({
                        ...this.state,
                        loadingMessage: progressInfo.message
                    })
                })
                this.setState({
                    ...this.state,
                    loadingMessage: null
                })
                console.log("activated ", this.props.selectedServiceKey, "successfully.")
                this.props.dispatchDataReload(this.props.explorationState.info)
            } catch (error) {
                console.log("service activation error: ", this.props.selectedServiceKey, error)
            }
        }
        this.setState({
            ...this.state,
            loadingMessage: "Checking permission..."
        })
        await this.checkPermission()

        this.setState({
            ...this.state,
            initialLoadingFinished: true
        })
    }

    async componentDidUpdate(prevProps: ExplorationProps) {
        if (this.props.explorationState.info.type !== prevProps.explorationState.info.type || deepEqual(prevProps.explorationState.info.values, this.props.explorationState.info.values) === false) {
            if (this.state.initialLoadingFinished === true) {
                console.log("should reload data")
                this.props.dispatchDataReload(this.props.explorationState.info)
            }
        }
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.onAppStateChange)
        BackHandler.removeEventListener("hardwareBackPress", this.onHardwareBackPress)
    }

    onBottomBarButtonPress = (mode: ExplorationMode) => {
        switch (mode) {
            case ExplorationMode.Browse:
                this.props.dispatchCommand(createGoToBrowseOverviewAction(InteractionType.TouchOnly))
                break;
            case ExplorationMode.Compare:
                this.comparisonBottomSheetRef?.open()
                break;
        }
    }

    undo = () => {
        this.props.dispatchCommand(createRestorePreviousInfoAction())
    }

    onGlobalSpeechInputPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })

        const sessionId = makeNewSessionId()
        this.props.dispatchSetShowGlobalPopup(true, sessionId)
        this.props.dispatchStartSpeechSession(sessionId, this.props.explorationState.info.type)

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
                <ExplorationViewHeader {...this.props} />
            </View>
            <View style={styles.mainContainerStyle}>
                {/* main data panel ===================================================================*/}

                {
                    this.props.explorationDataState.isBusy === true && <BusyHorizontalIndicator />
                }

                {
                    this.props.explorationDataState.info != null ?
                        this.makeMainPanel(this.props.explorationDataState.info.type) : <></>
                }

                {/* history panel ===================================================================*/}
                {this.props.explorationState.prevInfo != null && <View style={styles.historyPanelStyle}>
                    <Button
                        containerStyle={styles.historyButtonContainerStyle}
                        buttonStyle={styles.historyButtonStyle}
                        icon={undoIconStyle} onPress={this.undo}
                        title="Cancel latest"
                        titleStyle={styles.historyButtonTitleStyle}
                    />
                </View>
                }
            </View>

            <BottomBar mode={explorationInfoHelper.getMode(this.props.explorationState.info)}
                onModePress={this.onBottomBarButtonPress}
                onVoiceButtonPressIn={this.onGlobalSpeechInputPressIn}
                onVoiceButtonPressOut={this.onGlobalSpeechInputPressOut}
            />

            <BottomSheet ref={ref => { this.comparisonBottomSheetRef = ref }}>
                <ComparisonInitPanel info={this.props.explorationState.info} onCompleted={() => { this.comparisonBottomSheetRef.close() }} />
            </BottomSheet>

            <TooltipOverlay />
            <GlobalSpeechOverlay isGlobalSpeechButtonPressed={this.props.showGlobalSpeechPopup} />

            <DataBusyOverlay isBusy={this.props.explorationDataState.isBusy === true || this.state.initialLoadingFinished === false} />
            {
                this.state.initialLoadingFinished === false ? <InitialLoadingIndicator loadingMessage={this.state.loadingMessage} /> : <></>
            }

        </View>
    }

    makeMainPanel(type: ExplorationType): any {
        switch (type) {
            case ExplorationType.B_Overview:
                return <OverviewMainPanel />
            case ExplorationType.B_Range:
                return <BrowseRangeMainPanel />
            case ExplorationType.B_Day:
                return getIntraDayMainPanel(this.props.explorationDataState.info)
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
        explorationState: appState.explorationState,
        explorationDataState: appState.explorationDataState,
        selectedServiceKey: appState.settingsState.serviceKey,
        showGlobalSpeechPopup: appState.speechRecognizerState.showGlobalPopup
    }
}

const explorationScreen = connect(mapStateToProps, mapDispatchToProps)(ExplorationScreen)
export { explorationScreen as ExplorationScreen }