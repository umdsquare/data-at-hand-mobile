import React from "react";
import LinearGradient from "react-native-linear-gradient";
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { TouchableHighlight } from "react-native-gesture-handler";
import LottieView from 'lottie-react-native';
import { StyleSheet, View, LayoutAnimation } from "react-native";
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

const pressAnimConfig = {
    ...LayoutAnimation.Presets.easeInEaseOut,
    duration: 150
}

const unPressAnimConfig = {
    ...LayoutAnimation.Presets.easeInEaseOut,
    duration: 250
}



interface Props {
    isBusy: boolean,
    containerStyle?: any,
    onTouchDown: () => {},
    onTouchUp: () => {}
}

interface State {
    isPressed: boolean
}

export class VoiceInputButton extends React.PureComponent<Props, State> {

    constructor(props) {
        super(props)

        this.state = {
            isPressed: false
        }
    }

    readonly onPressIn = () => {
        this.setState({...this.state, isPressed: true})
        LayoutAnimation.configureNext(pressAnimConfig)
        this.props.onTouchDown()
    }

    readonly onPressOut = () => {
        this.setState({...this.state, isPressed: false})
        LayoutAnimation.configureNext(unPressAnimConfig)
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
                opacity: this.props.isBusy === true ? 0.8 : 1,
                marginTop: this.state.isPressed === true? 5: 0
            }}>
            <TouchableHighlight
                style={Styles.buttonContainerStyle}
                activeOpacity={0.9}
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
                                <View
                                    style={{ marginTop: this.state.isPressed === true? 8 : 0}}
                                >
                                    <FontAwesomeIcon name="microphone" size={microphoneButtonIconSize} color="rgba(255,255,255,0.95)"></FontAwesomeIcon>
                                </View>
                            )
                    }

                </LinearGradient>
            </TouchableHighlight>
        </View>
        )
    }
}