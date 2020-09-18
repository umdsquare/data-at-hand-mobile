import React from 'react';
import { SpeechNotificationEvent } from '@core/speech/SpeechEventQueue';
import { View, Text, Animated, Easing, StyleSheet, ViewStyle, Platform } from 'react-native';
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
import StyledText from 'react-native-styled-text';
import { TapGestureHandler, State as GestureState, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const start = { x: 0, y: 0 }
const end = { x: 1, y: 1 }

//"#b5b5b590"

const gradientProps = { colors: Colors.decisionButtonGradient, start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }


const styles = StyleSheet.create({

    containerStyle: {
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
    },

    popupDialogStyle: {
        backgroundColor: Colors.WHITE,
        marginLeft: Sizes.horizontalPadding * 1.5,
        marginRight: Sizes.horizontalPadding * 1.5,
        borderRadius: 8,
        paddingTop: Sizes.verticalPadding * 0.7,
        shadowColor: '#324749',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 8,
        shadowOpacity: 0.3,
        elevation: 8,
    },

    gradientStyleBase: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        borderRadius: 12,
        paddingLeft: 10,
        paddingRight: 23,
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
        //marginRight: Sizes.horizontalPadding * .5
    },

    speechMessageStyle: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.link,
        fontSize: Sizes.normalFontSize,

        margin: Sizes.horizontalPadding,
        marginTop: Sizes.verticalPadding * .5,
        marginBottom: Sizes.verticalPadding * .5
    },

    buttonStyle: { backgroundColor: Colors.TRANSPARENT, borderRadius: 50, paddingTop: Sizes.verticalPadding * .5, paddingBottom: Sizes.verticalPadding * .5, paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding },

    cancelButtonStyle: { backgroundColor: Colors.TRANSPARENT, paddingTop: Sizes.verticalPadding * .75, paddingBottom: Sizes.verticalPadding * .75, borderTopColor: Colors.lightBorderColor, borderTopWidth: 2 },

    buttonTitleStyle: { fontSize: Sizes.smallFontSize, fontWeight: 'bold' },

    cancelButtonTitleStyle: { fontSize: Sizes.normalFontSize, color: Colors.primary, fontWeight: 'bold' },

    buttonsContainerStyle: { flexDirection: 'row', justifyContent: 'flex-end' },

    popupMessageStyle: {
        fontSize: Sizes.normalFontSize, fontWeight: "400",
        lineHeight: Sizes.normalFontSize * 1.4,
        padding: Sizes.verticalPadding * .5,
        marginLeft: Sizes.horizontalPadding,
        marginRight: Sizes.horizontalPadding
    }
})

const popupMessageTextStyles = StyleSheet.create(
    {
        b: {
            color: Colors.textColorLight,
            fontWeight: 'bold'
        }
    }
)

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

            if (currentEvent.type === NLUResultType.PromptingInformDialog) {
                console.log("show prompt")

                this.animProgress.setValue(0)

                this.currentAnimation?.stop()

                this.currentAnimation = Animated.timing(this.animProgress, { toValue: 1, duration: 400, useNativeDriver: true })

                this.currentAnimation.start()

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
                        Animated.delay(currentEvent.type !== NLUResultType.Fail ? 300 : (this.state.currentEvent.nluResult.message != null ? 2000 : 800)),
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
    /*
        private onPromptCancel = () => {
            const speechCommandLogId = this.state.currentEvent?.nluResult?.globalCommandSimulatedResult?.action?._metadata?.speechLogId
            SystemLogger.instance.logVerboseToInteractionStateTransition(VerboseEventTypes.CanceledSpeechPromptDialog, { speechLogId: speechCommandLogId })
            this.showNext()
        }*/

    private onBackdropClick = (ev: TapGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            this.showNext()
        }
    }

    render() {

        return <View pointerEvents={this.state.currentEvent != null && this.state.currentEvent.type === NLUResultType.PromptingInformDialog ? "auto" : "none"}
            style={styles.containerStyle}>
            {this.state.currentEvent != null && this.state.currentEvent.type !== NLUResultType.PromptingInformDialog ? <AnimatedLinearGradient style={[
                styles.gradientStyleBase,
                {
                    opacity: this.animProgress,
                    transform: [
                        {
                            scale: this.animProgress
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
                    this.state.currentEvent.nluResult.message != null ? this.state.currentEvent.nluResult.message :
                        branchByType(this.state.currentEvent!.type, "Got it.", "You're already there.", "Unapplicable command for now.", "Sorry, I couldn\'t understand.")
                }</Text>
            </AnimatedLinearGradient> : null}
            {
                this.state.currentEvent != null && this.state.currentEvent.type === NLUResultType.PromptingInformDialog ? <>

                    <TapGestureHandler onHandlerStateChange={this.onBackdropClick} maxDurationMs={Number.MAX_VALUE}>
                        {Platform.select({
                            ios: <AnimatedLinearGradient style={{
                                ...StyleTemplates.fitParent,
                                opacity: this.animProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.4]
                                })
                            }} colors={["#00000000", "#000000FF"]} />,
                            android: <Animated.View style={{
                                ...StyleTemplates.fitParent,
                                backgroundColor: 'black',
                                opacity: this.animProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.25]
                                })
                            }} />
                        })
                        }</TapGestureHandler>

                    <Animated.View style={
                        {
                            ...styles.popupDialogStyle,
                            opacity: this.animProgress,
                            transform: [{
                                translateY: this.animProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0]
                                })
                            }],
                        }
                    }>
                        <Text style={styles.speechMessageStyle}>"{this.state.currentEvent?.nluResult?.preprocessed?.original}"</Text>
                        <StyledText
                            style={styles.popupMessageStyle}
                            textStyles={popupMessageTextStyles}
                        >
                            {(this.state.currentEvent?.nluResult?.message ? this.state.currentEvent?.nluResult?.message :
                                "Your speech command is not related to the pressed element.")}
                        </StyledText>
                        <Button
                            containerStyle={styles.cancelButtonContainerStyle}
                            buttonStyle={styles.cancelButtonStyle}
                            iconRight={false}
                            titleStyle={styles.cancelButtonTitleStyle}
                            title="OK"
                            onPress={this.showNext}
                        />
                        {/*
                        <View style={styles.buttonsContainerStyle}>
                            <Button
                                containerStyle={styles.cancelButtonContainerStyle}
                                buttonStyle={styles.cancelButtonStyle}
                                iconRight={false}
                                titleStyle={styles.cancelButtonTitleStyle}
                                title="Cancel"
                                onPress={this.onPromptCancel}
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
                            */}
                    </Animated.View>
                </> : null
            }
        </View>
    }
}

const connected = connect(null, null, null, { forwardRef: true })(SpeechEventNotificationOverlay)
export { connected as SpeechEventNotificationOverlay }