import React, { Component } from 'react';
import { View, Text, SafeAreaView, Animated, Platform, StatusBar } from 'react-native';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';
import { StyleTemplates } from '../../style/Styles';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationStackOptions } from 'react-navigation-stack';
import RBSheet from "react-native-raw-bottom-sheet";
import { ConfigurationPanel } from './settings/ConfigurationPanel';
import { Sizes } from '../../style/Sizes';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import { Logo } from '../Logo';
import { PropsWithNavigation } from '../../PropsWithNavigation';
import { voiceDictator } from '../../speech/VoiceDictator';
import { DictationResult, NLUResult } from '../../speech/types';
import { VoiceInputButton } from '../speech/VoiceInputButton';
import { SpeechInputPopup } from '../speech/SpeechInputPopup';
import { SpeechCommandSession, SessionStatus, TerminationPayload, TerminationReason } from '../../speech/SpeechCommandSession';
import { NLUResultPanel } from '../speech/NLUResultPanel';
import { DarkOverlay } from '../common/DarkOverlay';
import { ReportCard } from '../report/ReportCard';

const appBarIconStyles = {
    buttonStyle: {
        width: Sizes.navHeaderSize,
        height: Sizes.navHeaderSize,
        backgroundColor: 'transparent',
        margin: 0
    } as any,
    iconSize: Sizes.navHeaderSize / 2.2,
    iconColor: Colors.accent,
}

interface State {
    isLoading: boolean,
    dictationResult: DictationResult,
    nluResult: NLUResult,
    speechCommandSessionStatus: SessionStatus
}

export class HomeScreen extends React.Component<PropsWithNavigation, State> {

    static navigationOptions = ({ navigation }) => ({
        headerLeft: (<Logo />),
        headerLeftContainerStyle: { paddingLeft: Sizes.horizontalPadding },
        headerRight: (
            <View style={{
                flexDirection: 'row', alignItems: 'center',
            }}>
                <Button
                    icon={{
                        name: "ios-switch",
                        type: "ionicon",
                        size: appBarIconStyles.iconSize,
                        color: appBarIconStyles.iconColor
                    }}
                    buttonStyle={appBarIconStyles.buttonStyle}
                    onPress={() => {
                        navigation.getParam('openConfigSheet')()
                    }} />

                <Button
                    icon={{
                        name: "md-git-network",
                        type: "ionicon",
                        size: appBarIconStyles.iconSize,
                        color: appBarIconStyles.iconColor
                    }}
                    buttonStyle={{ ...appBarIconStyles.buttonStyle }}
                    onPress={() => {
                        navigation.navigate("MeasureSettings")
                    }} />
            </View>
        )
    } as NavigationStackOptions)

    private _configSheetRef: RBSheet = null

    private _darkOverlayRef: DarkOverlay = null

    private _speechPopupRef: SpeechInputPopup = null

    private _currentSpeechCommandSession: SpeechCommandSession = null

    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            dictationResult: null,
            nluResult: null,
            speechCommandSessionStatus: SessionStatus.Idle
        }
    }

    componentDidMount() {
        this.props.navigation.setParams({
            openConfigSheet: this._openConfigSheet,
        })
    }

    async componentWillUnmount() {
        await voiceDictator.uninstall()

        if (this._currentSpeechCommandSession) {
            this._currentSpeechCommandSession.dispose()
        }
    }

    private async startNewSpeechCommandSession() {
        if (this._currentSpeechCommandSession == null) {
            this._currentSpeechCommandSession = new SpeechCommandSession(
                (status, payload) => {
                    console.log("status:", status)
                    this.setState({ ...this.state, speechCommandSessionStatus: status })
                    switch (status) {
                        case SessionStatus.Starting:
                            this.setState({
                                ...this.state,
                                nluResult: null
                            })
                            this._speechPopupRef.show()
                            this._darkOverlayRef.show()
                            break;
                        case SessionStatus.Analyzing:
                            this._speechPopupRef.hide()
                            this._darkOverlayRef.hide()
                            break;
                        case SessionStatus.Terminated:
                            const terminationPayload: TerminationPayload = payload as TerminationPayload
                            console.log("termination reason:", terminationPayload.reason)
                            if (terminationPayload.reason === TerminationReason.Success) {
                                const data: NLUResult = terminationPayload.data
                                this.setState({
                                    ...this.state,
                                    nluResult: data
                                })
                            } else {
                            }
                            this.setState({
                                ...this.state,
                                dictationResult: null,
                                speechCommandSessionStatus: null
                            })
                            this._currentSpeechCommandSession.dispose()
                            this._currentSpeechCommandSession = null
                            this._darkOverlayRef.hide()
                            break;
                    }
                },
                (output: DictationResult) => {
                    this.setState({
                        ...this.state,
                        dictationResult: output
                    })
                }
            )
            await this._currentSpeechCommandSession.requestStart()
        }
    }

    private async stopSpeechInput() {
        if (this._currentSpeechCommandSession) {
            await this._currentSpeechCommandSession.requestStopListening()
        }
    }

    _closeConfigSheet = () => {
        if (this._configSheetRef) {
            this._configSheetRef.close()
        }
    }


    _openConfigSheet = () => {
        if (this._configSheetRef) {
            this._configSheetRef.open()
        }
    }

    private onVoiceInputButtonPressed = async () => {
        await this.startNewSpeechCommandSession()
    }

    private onVoiceInputButtonUp = async () => {
        this._speechPopupRef.hide()
        await this.stopSpeechInput()
    }

    render() {
        return (
            <LinearGradient
                style={{ flex: 1, alignSelf: 'stretch' }}
                colors={Colors.lightBackgroundGradient}>
                <SafeAreaView style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                    {Platform.OS === 'android' &&
                        <StatusBar barStyle="dark-content" backgroundColor='white' />}

                    <View style={{ zIndex: Platform.OS === 'android' ? 100 : undefined, flex: 1, alignSelf: 'stretch', }}>
                        <ReportCard />
                    </View>

                    <DarkOverlay style={{ zIndex: Platform.OS === 'android' ? 1000 : undefined }} ref={ref => this._darkOverlayRef = ref} />

                    <View style={{ alignSelf: 'stretch', flexDirection: 'column', alignItems: 'center' }}>
                        <NLUResultPanel status={this.state.speechCommandSessionStatus} nluResult={this.state.nluResult} />
                        <SpeechInputPopup ref={ref => this._speechPopupRef = ref} dictationResult={this.state.dictationResult} />
                    </View>

                    <View style={{
                        alignSelf: 'stretch', /*backgroundColor: 'white',
                    shadowColor: 'black',
                    shadowOffset: { width: 0, height: -1 },
                    shadowRadius: 2,
                    shadowOpacity: 0.07*/
                    }}>
                        <VoiceInputButton containerStyle={{ alignSelf: 'center', marginBottom: 18 }}
                            isBusy={this.state.speechCommandSessionStatus != SessionStatus.Terminated && this.state.speechCommandSessionStatus >= SessionStatus.Analyzing}
                            onTouchDown={this.onVoiceInputButtonPressed}
                            onTouchUp={this.onVoiceInputButtonUp} />
                    </View>




                </SafeAreaView>

                <RBSheet ref={
                    ref => {
                        this._configSheetRef = ref
                    }}
                    duration={240}
                    animationType="fade"
                    customStyles={
                        {
                            container: {
                                borderTopStartRadius: Platform.OS === 'ios' ? 8 : 0,
                                borderTopEndRadius: Platform.OS === 'ios' ? 8 : 0,
                                backgroundColor: Colors.lightBackground
                            }
                        }
                    }
                >

                    <View style={{
                        flexDirection: 'row',
                        padding: Sizes.horizontalPadding,
                        paddingTop: Sizes.verticalPadding,
                        paddingRight: 10,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={StyleTemplates.titleTextStyle}>Settings</Text>
                        {Platform.OS === 'ios' &&
                            <Button buttonStyle={{
                                backgroundColor: 'transparent'
                            }}
                                icon={<AntDesignIcon name="closecircle" size={26} color={Colors.lightFormBackground} />}
                                onPress={this._closeConfigSheet}
                            />
                        }
                    </View>
                    <ConfigurationPanel />
                </RBSheet>
            </LinearGradient>
        );
    }
}
