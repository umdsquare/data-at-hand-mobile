import React from "react";
import { StatusBar, View, StyleSheet, Platform, BackHandler, Alert, AppState, AppStateStatus, GestureResponderEvent, InteractionManager, findNodeHandle } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
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
import { InitialLoadingIndicator } from "./parts/main/InitialLoadingIndicator";
import { createSetShowGlobalPopupAction } from "../../../state/speech/actions";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../Routes";
import { SpeechContextHelper } from "../../../core/speech/nlp/context";
import { test } from "../../../core/speech/nlp/preprocessor";

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
    undoIgnored: boolean
}


class ExplorationScreen extends React.PureComponent<ExplorationProps, State> {

    private comparisonBottomSheetRef = React.createRef<BottomSheet>()
    private speechUndoButtonRef = React.createRef<Button>()

    private undoHideTimeout: NodeJS.Timeout | null = null

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
        if (this.props.backNavStackSize > 0) {
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
            globalSpeechSessionId: null,
            undoIgnored: false
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
                this.props.dispatchDataReload(this.props.explorationInfo)
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

            <BottomSheet ref={this.comparisonBottomSheetRef}>
                <ComparisonInitPanel info={this.props.explorationInfo} onCompleted={() => { this.comparisonBottomSheetRef.current?.close() }} />
            </BottomSheet>

            <TooltipOverlay />
            <GlobalSpeechOverlay isGlobalSpeechButtonPressed={this.props.showGlobalSpeechPopup} />

            <DataBusyOverlay isBusy={this.props.isDataLoading === true || this.state.initialLoadingFinished === false} />
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
                return getIntraDayMainPanel(this.props.loadedDataInfo)
            case ExplorationType.C_Cyclic:
                return <CyclicComparisonMainPanel />
            case ExplorationType.C_TwoRanges:
                return <MultiRangeComparisonMainPanel/>
            case ExplorationType.C_CyclicDetail_Range:
                return <MultiRangeComparisonMainPanel/>
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