import React from "react";
import LinearGradient from "react-native-linear-gradient";
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { TouchableHighlight } from "react-native-gesture-handler";
import LottieView from 'lottie-react-native';
import { Platform, StyleSheet, Animated, View, Easing } from "react-native";
import Colors from "../../style/Colors";
import { Sizes } from "../../style/Sizes";

const microphoneButtonIconSize = 26

const busyColor = ["rgba(0,0,0,0)", "rgba(0,0,0,0.1)"]

const Styles = StyleSheet.create({
    buttonContainerStyle: {
        width: Sizes.speechInputButtonSize,
        height: Sizes.speechInputButtonSize,
        borderRadius: 100
    },
    loadingIconStyle: {
        width: 42, height: 42, transform: [{ translateY: 0.5 }, { scale: 2 }], opacity: 0.5
    }
})

interface Props {
    isBusy: boolean,
    containerStyle?: any,
    onTouchDown: () => {},
    onTouchUp: () => {}
}

interface State {
    interpolation: Animated.Value
}

export class VoiceInputButton extends React.PureComponent<Props, State> {

    private iconContainerRef

    private currentAnimation: Animated.CompositeAnimation

    constructor(props) {
        super(props)

        this.state = {
            interpolation: new Animated.Value(0)
        }
    }

    readonly onPressIn = () => {
        if(this.currentAnimation){
            this.currentAnimation.stop()
        }
        this.currentAnimation = Animated.timing(this.state.interpolation, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.cubic) })
        this.currentAnimation.start(() => {
            this.currentAnimation = null
        })

        this.props.onTouchDown()
    }

    readonly onPressOut = () => {
        if(this.currentAnimation){
            this.currentAnimation.stop()
        }
        this.currentAnimation = Animated.timing(this.state.interpolation, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.cubic) })
        this.currentAnimation.start(() => {
            this.currentAnimation = null
        })
        this.props.onTouchUp()
    }

    render() {
        return (<View
            style={{
                ...this.props.containerStyle,
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 5 },
                shadowRadius: 4,
                shadowOpacity: 0.3,
                elevation: 3,
                opacity: this.props.isBusy === true ? 0.8 : 1
            }}>
            <TouchableHighlight
                style={Styles.buttonContainerStyle}

                onPress={() => {
                }}
                onPressIn={this.onPressIn}
                onPressOut={this.onPressOut}
                disabled={this.props.isBusy}
            >
                <LinearGradient
                    colors={this.props.isBusy === true ? busyColor : Colors.speechAffordanceGradient}
                    start={{ x: 0.0, y: 0.0 }} end={{ x: 1, y: 1 }}
                    style={{
                        width: Sizes.speechInputButtonSize,
                        height: Sizes.speechInputButtonSize,
                        borderRadius: 100,
                        borderColor: "rgba(255,255,255,0.3)",
                        alignItems: 'center',
                        alignSelf: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                    }}
                >
                    {
                        this.props.isBusy === true ?
                            (<LottieView source={require("../../../assets/lottie/5257-loading.json")} autoPlay loop
                                style={Styles.loadingIconStyle} />)
                            : (
                                <Animated.View
                                    style={{ marginTop: this.state.interpolation.interpolate({
                                        inputRange: [0,1],
                                        outputRange: [0, 8]
                                    }) }}
                                >
                                    <FontAwesomeIcon name="microphone" size={microphoneButtonIconSize} color="rgba(255,255,255,0.95)"></FontAwesomeIcon>
                                </Animated.View>
                            )
                    }

                </LinearGradient>
            </TouchableHighlight>
        </View>
        )
    }
}