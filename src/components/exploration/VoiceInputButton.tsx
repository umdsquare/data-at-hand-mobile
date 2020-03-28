import React from "react";
import LinearGradient from "react-native-linear-gradient";
import { TapGestureHandler, TapGestureHandlerStateChangeEvent, State } from "react-native-gesture-handler";
import { StyleSheet, View, LayoutAnimation } from "react-native";
import Colors from "@style/Colors";
import { Sizes } from "@style/Sizes";
import { SvgIconType, SvgIcon } from "@components/common/svg/SvgIcon";

const microphoneButtonIconSize = 32

const busyColor = ["rgba(0,0,0,0)", "rgba(0,0,0,0.1)"]

const Styles = StyleSheet.create({
    containerStyleBase: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 4,
        shadowOpacity: 0.3,
        elevation: 5,
    },

    buttonContainerStyle: {
        width: Sizes.speechInputButtonSize,
        height: Sizes.speechInputButtonSize,
        borderRadius: 100
    },
    loadingIconStyle: {
        width: 42, height: 42, transform: [{ translateY: 0.5 }, { scale: 2 }], opacity: 0.5
    },

    gradientStyle: {
        width: Sizes.speechInputButtonSize,
        height: Sizes.speechInputButtonSize,
        borderRadius: 100,
        borderColor: "rgba(255,255,255,0.3)",
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
    onTouchDown: () => void,
    onTouchUp: () => void
}

interface ComponentState {
    isPressed: boolean
}

export class VoiceInputButton extends React.PureComponent<Props, ComponentState> {

    constructor(props: Props) {
        super(props)

        this.state = {
            isPressed: false
        }
    }

    private readonly onButtonStateChange = (ev: TapGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === State.BEGAN) {
            this.setState({ ...this.state, isPressed: true })
            LayoutAnimation.configureNext(pressAnimConfig)
            this.props.onTouchDown()
        } else if (ev.nativeEvent.state === State.END) {
            this.setState({ ...this.state, isPressed: false })
            LayoutAnimation.configureNext(unPressAnimConfig)
            this.props.onTouchUp()
        }
    }

    render() {
        return (<View
            style={{
                ...this.props.containerStyle,
                ...Styles.containerStyleBase,
                opacity: this.props.isBusy === true ? 0.8 : 1,
                marginTop: this.state.isPressed === true ? 5 : 0
            }}>
            <TapGestureHandler
                enabled={!this.props.isBusy}
                maxDurationMs={Number.MAX_VALUE}
                onHandlerStateChange={this.onButtonStateChange}
                shouldCancelWhenOutside={false}
                maxDist={Number.MAX_VALUE}
            ><View style={Styles.buttonContainerStyle}>
                    <LinearGradient
                        colors={this.props.isBusy === true ? busyColor : Colors.speechAffordanceGradient}
                        start={{ x: 0.0, y: 0.0 }} end={{ x: 1, y: 1 }}
                        style={Styles.gradientStyle}
                    >
                        {
                            <View
                                style={{ marginTop: this.state.isPressed === true ? 5 : 0 }}
                            >
                                <SvgIcon type={SvgIconType.Microphone} size={microphoneButtonIconSize} color="rgba(255,255,255,0.95)" />
                            </View>
                        }

                    </LinearGradient>
                </View>
            </TapGestureHandler>
        </View>
        )
    }
}