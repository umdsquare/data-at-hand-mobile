import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sizes } from '@style/Sizes';
import { connect, useSelector, shallowEqual } from 'react-redux';
import { ReduxAppState } from '@state/types';
import { SpeechRecognizerState, SpeechRecognizerSessionStatus } from '@state/speech/types';
import Colors from '@style/Colors';
import Spinner from 'react-native-spinkit';
import { generateExampleSentences } from '@core/speech/ExampleSentenceRecommender';
import { DataServiceManager } from '@measure/DataServiceManager';

const styles = StyleSheet.create({
    containerStyle: {
        padding: Sizes.horizontalPadding,
        paddingTop: Sizes.verticalPadding,
        paddingBottom: Sizes.verticalPadding,
        alignItems: 'center'
    },

    listeningTextStyle: {
        color: Colors.speechAffordanceColorBackground,
        fontSize: Sizes.normalFontSize,
        fontWeight: '500',
        marginLeft: 4
    },

    waitingTextStyle: {
        color: Colors.accent,
        fontSize: Sizes.smallFontSize,
        fontWeight: '500',
        marginLeft: 12
    },

    titleContainerStyle: {
        flexDirection: 'row', alignSelf: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    dictatedMessageStyle: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.link,
        fontSize: Sizes.smallFontSize
    },

    exampleTextTitleStyle: {
        color: Colors.speechExampleTextColor,
        fontSize: Sizes.normalFontSize,
        marginBottom: 8
    },

    exampleTextSentenceStyle: {
        color: Colors.speechExampleTextColor,
        fontSize: Sizes.normalFontSize,
        fontWeight: '600',
        marginTop: 6,
        marginRight: 3, marginLeft: 3
    }
})

export const SpeechInputPanel = React.memo(() => {

    const { explorationInfo, speechStatus, dictationResult, speechContext, serviceKey } = useSelector((appState: ReduxAppState) => ({
        dictationResult: appState.speechRecognizerState.dictationResult,
        explorationInfo: appState.explorationState.info,
        speechContext: appState.speechRecognizerState.currentSpeechContext,
        speechStatus: appState.speechRecognizerState.status,
        serviceKey: appState.settingsState.serviceKey
    }), shallowEqual)

    const selectedService = DataServiceManager.instance.getServiceByKey(serviceKey)

    const isRecognizedTextExists = useMemo(() => {
        return !(dictationResult == null
            || dictationResult.text == null
            || dictationResult!.text!.length === 0)
    }, [dictationResult])

    const examples = useMemo(() => {
        return generateExampleSentences(explorationInfo, speechContext, selectedService.getToday())
    }, [explorationInfo, speechContext])

    switch (speechStatus) {
        case SpeechRecognizerSessionStatus.Waiting:
            return <View style={styles.containerStyle}>
                <View style={styles.titleContainerStyle}>
                    <Spinner size={20} isVisible={true} type="FadingCircle" color={Colors.accent} />
                    <Text style={styles.waitingTextStyle}>Processing the previous command...</Text>
                </View>
            </View>
        default:
            return <View style={styles.containerStyle}>

                <View style={styles.titleContainerStyle}>
                    <Spinner size={20} isVisible={true} type="Wave" color={Colors.speechAffordanceColorBackground} />
                    <Text style={styles.listeningTextStyle}>Listening...</Text>
                </View>

                {
                    isRecognizedTextExists === true ? <Text style={styles.dictatedMessageStyle}>
                        {
                            dictationResult ? (dictationResult.diffResult ?
                                dictationResult.diffResult.map((diffElm, i) => {
                                    if (diffElm.added == null && diffElm.removed == null) {
                                        return <Text key={i} >{diffElm.value}</Text>
                                    } else if (diffElm.added === true) {
                                        return <Text key={i} style={{ color: Colors.accent }}>{diffElm.value}</Text>
                                    }
                                }) : dictationResult.text) : undefined
                        }
                        _</Text>
                        : <View style={{
                            alignItems: 'center'
                        }}>
                            {
                                examples != null ? <>
                                    <Text style={styles.exampleTextTitleStyle}>Say something like:</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-around',
                                    }}>
                                        {
                                            examples.map((example, i) => <Text key={i.toString()} style={styles.exampleTextSentenceStyle}>"{example}"</Text>)
                                        }
                                    </View>
                                </> : <Text style={styles.exampleTextTitleStyle}>What can I do for you?</Text>
                            }
                        </View>
                }
            </View>
    }
})