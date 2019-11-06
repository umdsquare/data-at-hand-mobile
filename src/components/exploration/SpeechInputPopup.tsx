import React from 'react';
import { Text, View, Animated, Easing, StyleSheet, } from 'react-native';
import { Sizes } from '../../style/Sizes';
import LottieView from 'lottie-react-native';
import Colors from '../../style/Colors';
import { DictationResult } from '../../core/speech/types';

enum AnimationType {
    Show, Hide
}

const AnimatedValues = {
    shadowOffsetHeight: [2, 24],
    opacity: [0, 1],
    bottom: [0, 64]
}

const InterpolationConfigBase = { inputRange: [0, 1] }

const Styles = StyleSheet.create({
    listeningTextStyle: {
        color: Colors.textColorDark,
        fontSize: Sizes.titleFontSize,
        fontWeight: '200'
    },
    messageContainerStyle: {
        flexDirection: 'row', alignSelf: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    dictatedMessageStyle: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.link,
        fontSize: Sizes.subtitleFontSize
    },
    loadingIconStyle: {
        width: 36, height: 36, transform: [{ translateY: 0.5 }, { scale: 2 }], opacity: 0.8
    }
})

interface Props {
    containerStyle?: any,
    dictationResult: DictationResult
}

interface State {
    interpolation: Animated.Value
}

export class SpeechInputPopup extends React.Component<Props, State> {

    private currentAnimation: Animated.CompositeAnimation

    private currentAnimType: AnimationType
    private queuedAnimType: AnimationType

    constructor(props) {
        super(props)
        this.state = {
            interpolation: new Animated.Value(0)
        }
    }

    show() {
        if (this.currentAnimation) {
            if (this.currentAnimType !== AnimationType.Show) {
                this.queuedAnimType = AnimationType.Show
            }
        } else {
            this.currentAnimation = Animated.timing(this.state.interpolation, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.cubic) })
            this.currentAnimType = AnimationType.Show
            this.currentAnimation.start(() => {
                this.currentAnimation = null
                this.currentAnimType = null
                if (this.queuedAnimType === AnimationType.Hide) {
                    this.queuedAnimType = null
                    this.hide()
                } else {
                    this.queuedAnimType = null
                }
            })
        }
    }

    hide() {

        if (this.currentAnimation) {
            if (this.currentAnimType !== AnimationType.Hide) {
                this.queuedAnimType = AnimationType.Hide
            }
        } else {
            this.currentAnimation = Animated.timing(this.state.interpolation, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.cubic) })
            this.currentAnimType = AnimationType.Hide
            this.currentAnimation.start(() => {
                this.currentAnimation = null
                this.currentAnimType = null
                if (this.queuedAnimType === AnimationType.Show) {
                    this.queuedAnimType = null
                    this.show()
                } else {
                    this.queuedAnimType = null
                }
            })
        }
    }

    private interpolate(name: string): any {
        return this.state.interpolation
            .interpolate({ ...InterpolationConfigBase, outputRange: AnimatedValues[name] })
    }

    render() {
        return (
            <Animated.View
                style={{
                    position: 'absolute',
                    left: 40,
                    right: 40,
                    bottom: this.interpolate("bottom"),
                    backgroundColor: 'white',
                    borderRadius: 8,
                    opacity: this.interpolate("opacity"),
                    shadowColor: '#324749',
                    shadowOffset: { width: 0, height: this.interpolate("shadowOffsetHeight") },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    padding: 24,
                    paddingTop: 16,
                    zIndex: 2000
                }}>
                <View style={Styles.messageContainerStyle}>
                    <LottieView source={require("../../../assets/lottie/5257-loading.json")} autoPlay loop
                        style={Styles.loadingIconStyle} />
                    <Text style={Styles.listeningTextStyle}>I'm Listening...</Text>
                </View>

                <Text style={Styles.dictatedMessageStyle}>
                    {
                        this.props.dictationResult ? (this.props.dictationResult.diffResult ?
                            this.props.dictationResult.diffResult.map((diffElm, i) => {
                                if (diffElm.added == null && diffElm.removed == null) {
                                    return <Text key={i} >{diffElm.value}</Text>
                                } else if (diffElm.added === true) {
                                    return <Text key={i} style={{ color: Colors.accent }}>{diffElm.value}</Text>
                                }
                            }) : this.props.dictationResult.text) : null
                    }
                    _</Text>
            </Animated.View>
        )
    }
}