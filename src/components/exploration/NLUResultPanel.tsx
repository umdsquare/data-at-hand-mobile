import React from "react";
import { NLUResult } from "../../core/speech/types";
import { Animated, Text, Easing } from "react-native";
import { Sizes } from "../../style/Sizes";
import { SessionStatus } from "../../core/speech/SpeechCommandSession";
import Colors from "../../style/Colors";

const InterpolationConfigBase = { inputRange: [0, 1] }

const EmergenceAnimatedValues = {
    opacity: [0, 1],
    marginBottom: [12, 36],
    scale: [0.4, 1]
}

const TransitionAnimatedValues = {
    progressViewOpacity: [1, 0],
    resultViewOpacity: [0, 1],
}

interface Props {
    status: SessionStatus,
    nluResult: NLUResult
}

interface State {
    emergenceInterpolation: Animated.Value // appear/disappear animation
    transitionInterpolation: Animated.Value // transition between status (alpha blending)
}

export class NLUResultPanel extends React.Component<Props, State> {

    private currentEmergenceAnim: Animated.CompositeAnimation = null
    private currentTransitionAnim: Animated.CompositeAnimation = null

    constructor(props) {
        super(props)

        this.state = {
            emergenceInterpolation: new Animated.Value(0),
            transitionInterpolation: new Animated.Value(0)
        }
    }


    private interpEmergence(styleProperty: string): any {
        return this.state.emergenceInterpolation
            .interpolate({ ...InterpolationConfigBase, outputRange: EmergenceAnimatedValues[styleProperty] })
    }

    private interpTransition(styleProperty: string): any {
        return this.state.transitionInterpolation
            .interpolate({ ...InterpolationConfigBase, outputRange: TransitionAnimatedValues[styleProperty] })
    }


    show() {
        if (this.currentEmergenceAnim) {
            this.currentEmergenceAnim.stop()
        }
        this.currentEmergenceAnim = Animated.timing(this.state.emergenceInterpolation, { toValue: 1, duration: 200, easing: Easing.inOut(Easing.cubic) })
        this.currentEmergenceAnim.start(() => {
            this.currentEmergenceAnim = null
        })
    }

    hide() {
        if (this.currentEmergenceAnim) {
            this.currentEmergenceAnim.stop()
        }
        this.currentEmergenceAnim = Animated.timing(this.state.emergenceInterpolation, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.cubic) })
        this.currentEmergenceAnim.start(() => {
            this.currentEmergenceAnim = null
            this.state.transitionInterpolation.setValue(0)
            this.setState({ ...this.state })
        })
    }

    fadeInResult() {
        if (this.currentTransitionAnim) {
            this.currentTransitionAnim.stop()
        }
        this.currentTransitionAnim = Animated.timing(this.state.transitionInterpolation, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic) })
        this.currentTransitionAnim.start(() => {
            this.currentTransitionAnim = null
        })
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.status !== this.props.status) {
            if (prevProps.status < SessionStatus.Analyzing && this.props.status === SessionStatus.Analyzing) {
                console.log("started analyzing")
                this.show()
            } else if (prevProps.status === SessionStatus.Analyzing && this.props.status > SessionStatus.Analyzing) {
                console.log("finished analysis.")
                this.fadeInResult()
            }
        } else if (prevProps.status == null && this.props.status == null) {
            console.log("session restarted")
            this.hide()
        }
    }

    render() {
        return (
            <Animated.View style={{
                alignSelf: 'stretch',
                height: 120,
                opacity: this.interpEmergence("opacity"),
                transform: [{
                    scale: this.interpEmergence("scale")
                }]
            }}>
                <Animated.View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: this.interpEmergence("marginBottom"),
                        opacity: this.interpTransition("progressViewOpacity")
                    }}
                >
                    <Text style={{
                        fontSize: Sizes.BigFontSize,
                        fontWeight: '200'
                    }}>Analyzing...</Text>
                </Animated.View>


                {this.props.nluResult && <Animated.View style={{
                    alignSelf: 'center',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: this.interpEmergence("marginBottom"),
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: this.interpTransition("resultViewOpacity")
                }}>
                    <Text style={{ fontSize: Sizes.BigFontSize, fontWeight: '400', color: Colors.accent }}>{this.props.nluResult.intent} ({Math.round(this.props.nluResult.confidence * 100)}%)</Text>
                    {
                        Object.keys(this.props.nluResult.parameters).filter(key => this.props.nluResult.parameters[key] !== "").map((key, i) => {
                            return <Text key={i}>{key}: {JSON.stringify(this.props.nluResult.parameters[key])}</Text>
                        })
                    }
                </Animated.View>}
            </Animated.View>
        )
    }
}