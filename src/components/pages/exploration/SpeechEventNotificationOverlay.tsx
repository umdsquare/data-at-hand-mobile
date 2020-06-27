import React from 'react';
import { SpeechNotificationEvent } from '@core/speech/SpeechEventQueue';
import { View, Text, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { ZIndices } from '@components/pages/exploration/parts/zIndices';
import { StyleTemplates } from '@style/Styles';
import { SvgIcon, SvgIconType } from '@components/common/svg/SvgIcon';
import { Sizes } from '@style/Sizes';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '@style/Colors';
import { NLUResultType } from '@data-at-hand/core/speech/types';
import { Button } from 'react-native-elements';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const start = { x: 0, y: 0 }
const end = { x: 1, y: 1 }

const containerStyleBase = {
    position: 'absolute',
    zIndex: ZIndices.TooltipOverlay,
    elevation: 10,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 45,
    alignItems: 'center',
    justifyContent: 'center'
} as ViewStyle

const gradientProps = { colors: Colors.decisionButtonGradient, start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }


const styles = StyleSheet.create({

    containerStyle: containerStyleBase,

    opaqueContainerStyle: {
        ...containerStyleBase,
        backgroundColor: "#b5b5b590"
    },

    popupDialogStyle: {
        backgroundColor: Colors.WHITE,
        marginLeft: Sizes.horizontalPadding * 2,
        marginRight: Sizes.horizontalPadding * 2,
        borderRadius: 8,
        padding: Sizes.horizontalPadding,
        paddingTop: Sizes.verticalPadding * 0.7,
        shadowColor: '#324749',
        shadowRadius: 8,
        shadowOpacity: 0.3,
        elevation: 8,
    },

    gradientStyleBase: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        borderRadius: 50,
        paddingLeft: 12,
        paddingRight: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'green',
    },

    buttonContainerStyle: {
        marginTop: Sizes.verticalPadding,
        marginLeft: Sizes.horizontalPadding * .5,
    },

    cancelButtonContainerStyle: {
        marginTop: Sizes.verticalPadding,
        marginRight: Sizes.horizontalPadding * .5
    },

    speechMessageStyle: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.link,
        fontSize: Sizes.normalFontSize,

        marginTop: Sizes.verticalPadding * .5,
        marginBottom: Sizes.verticalPadding * .5
    },

    buttonStyle: { backgroundColor: Colors.TRANSPARENT, borderRadius: 50, paddingTop: Sizes.verticalPadding * .5, paddingBottom: Sizes.verticalPadding * .5, paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding },
    cancelButtonStyle: { backgroundColor: Colors.TRANSPARENT, paddingTop: Sizes.verticalPadding * .5, paddingBottom: Sizes.verticalPadding * .5 },

    buttonTitleStyle: { fontSize: Sizes.smallFontSize, fontWeight: 'bold' },
    cancelButtonTitleStyle: { fontSize: Sizes.smallFontSize, color: Colors.red, fontWeight: 'bold' },

    buttonsContainerStyle: { flexDirection: 'row', paddingTop: 0.5 * Sizes.verticalPadding, justifyContent: 'flex-end' },

    popupMessageStyle: {
        fontSize: Sizes.normalFontSize, fontWeight: "400",
        lineHeight: Sizes.normalFontSize * 1.4,
        padding: Sizes.verticalPadding * .5
    }
})

function branchByType<T>(type: NLUResultType, effectiveValue: T, voidValue: T, unapplicableValue: T, failValue: T): T {
    switch (type) {
        case NLUResultType.Effective: return effectiveValue
        case NLUResultType.Void: return voidValue
        case NLUResultType.Unapplicable: return unapplicableValue
        case NLUResultType.Fail: return failValue
    }
}

interface State {
    currentEvent?: SpeechNotificationEvent | null
}

class SpeechEventNotificationOverlay extends React.PureComponent<{ dispatch: Dispatch }, State> {

    private readonly eventsInQueue = Array<SpeechNotificationEvent>()

    private readonly animProgress = new Animated.Value(0)
    private readonly iconRotationProgress = new Animated.Value(0)
    private readonly iconScaleProgress = new Animated.Value(0)


    private currentAnimation: Animated.CompositeAnimation | undefined = undefined

    constructor(props: any) {
        super(props)
        this.state = {
            currentEvent: null
        }
    }

    public notify(event: SpeechNotificationEvent) {
        if (this.eventsInQueue.length > 0) {
            this.eventsInQueue.splice(0)
        }
        this.eventsInQueue.push(event)
        if (this.state.currentEvent == null) {
            this.showNext()
        }
    }

    private showNext = () => {
        if (this.eventsInQueue.length > 0) {
            const currentEvent = this.eventsInQueue.shift()
            this.setState({
                ...this.state,
                currentEvent: currentEvent
            })

            if (currentEvent.type === NLUResultType.NeedPromptingToGlobalCommand) {
                console.log("show prompt")
                this.currentAnimation?.stop()
                this.currentAnimation = undefined
            } else {

                this.animProgress.setValue(0)
                this.iconRotationProgress.setValue(0)
                this.iconScaleProgress.setValue(0)

                this.currentAnimation?.stop()

                this.currentAnimation = Animated.parallel([
                    Animated.sequence([
                        Animated.delay(100),
                        Animated.spring(this.animProgress, {
                            toValue: 1,
                            useNativeDriver: true
                        }),
                        Animated.delay(currentEvent.type !== NLUResultType.Fail ? 300 : 800),
                        Animated.timing(this.animProgress, {
                            toValue: 0,
                            easing: Easing.cubic,
                            duration: branchByType(currentEvent.type, 400, 600, 600, 600),
                            useNativeDriver: true
                        })
                    ]),
                    currentEvent.type !== NLUResultType.Fail ? Animated.sequence([
                        Animated.delay(100),
                        Animated.timing(this.iconRotationProgress,
                            {
                                toValue: 1,
                                duration: 400,
                                useNativeDriver: true,
                            })
                    ]) : undefined,
                    Animated.sequence([
                        Animated.delay(currentEvent.type !== NLUResultType.Fail ? 100 : 0),
                        Animated.timing(this.iconScaleProgress, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.elastic(currentEvent.type !== NLUResultType.Fail ? 3 : 1)
                        })
                    ])

                ])

                this.currentAnimation.start(() => {
                    this.showNext()
                })
            }
        } else {
            this.currentAnimation?.stop()
            this.currentAnimation = undefined
            this.setState({
                ...this.state,
                currentEvent: null
            })
        }
    }

    render() {

        return <View pointerEvents={this.state.currentEvent != null && this.state.currentEvent.type === NLUResultType.NeedPromptingToGlobalCommand ? "auto" : "none"}
            style={this.state.currentEvent != null && this.state.currentEvent.type === NLUResultType.NeedPromptingToGlobalCommand ? styles.opaqueContainerStyle : styles.containerStyle}>
            {this.state.currentEvent != null && this.state.currentEvent.type !== NLUResultType.NeedPromptingToGlobalCommand ? <AnimatedLinearGradient style={[
                styles.gradientStyleBase,
                {
                    opacity: this.animProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1]
                    }),
                    transform: [
                        {
                            scale: this.animProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                            })
                        }
                    ]
                }]}
                colors={branchByType(this.state.currentEvent.type,
                    Colors.speechSuccessGradient,
                    Colors.speechVoidGradient,
                    Colors.speechFailGradient,
                    Colors.speechFailGradient)}

                start={start} end={end}
            >
                <Animated.View style={
                    {
                        transform: [{
                            rotate: this.iconRotationProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 2 * Math.PI]
                            })
                        },
                        {
                            scale: this.iconScaleProgress
                        }]
                    }
                }>
                    <SvgIcon type={this.state.currentEvent.type !== NLUResultType.Fail ?
                        SvgIconType.Check : SvgIconType.QuestionMark}
                        color={Colors.WHITE} size={this.state.currentEvent.type !== NLUResultType.Fail ? 34 : 28} />
                </Animated.View>


                <Text style={{ marginLeft: 8, color: Colors.WHITE, fontSize: Sizes.normalFontSize }}>{
                    branchByType(this.state.currentEvent!.type, "Got it.", "Got it, but no effect.", "Unapplicable command for now.", "Sorry, I couldn\'t understand.")
                }</Text>
            </AnimatedLinearGradient> : null}
            {
                this.state.currentEvent != null && this.state.currentEvent.type === NLUResultType.NeedPromptingToGlobalCommand ? <View style={{
                    backgroundColor: Colors.WHITE,
                    margin: Sizes.horizontalPadding,
                    padding: Sizes.horizontalPadding,
                    borderRadius: 12,
                }}>
                    <Text style={styles.speechMessageStyle}>"{this.state.currentEvent?.nluResult?.preprocessed?.original}"</Text>
                    <Text style={styles.popupMessageStyle}>Your speech command is not related to the pressed element. Do you want to execute it as if through the mic button?</Text>
                    <View style={styles.buttonsContainerStyle}>
                        <Button
                            containerStyle={styles.cancelButtonContainerStyle}
                            buttonStyle={styles.cancelButtonStyle}
                            iconRight={false}
                            titleStyle={styles.cancelButtonTitleStyle}
                            title="Cancel"
                            onPress={this.showNext}
                        />
                        <Button
                            containerStyle={styles.buttonContainerStyle}
                            ViewComponent={LinearGradient}
                            linearGradientProps={gradientProps}
                            buttonStyle={styles.buttonStyle}
                            titleStyle={styles.buttonTitleStyle}
                            title="Execute"
                            onPress={() => {
                                const globalResult = this.state.currentEvent.nluResult.globalCommandSimulatedResult
                                this.props.dispatch(globalResult.action)
                                this.notify({
                                    type: globalResult.type,
                                    nluResult: globalResult,
                                    id: this.state.currentEvent?.id
                                })
                                this.showNext()
                            }}
                        />
                    </View>
                </View> : null
            }
        </View>
    }
}

const connected = connect(null, null, null, { forwardRef: true })(SpeechEventNotificationOverlay)
export { connected as SpeechEventNotificationOverlay }