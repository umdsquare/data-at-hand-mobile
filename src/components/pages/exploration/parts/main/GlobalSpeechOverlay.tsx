import React from 'react'
import { View, Animated, StyleSheet, Easing, Platform } from 'react-native'
import { StyleTemplates } from '../../../../../style/Styles'
import { SpeechInputPanel } from '../../../../exploration/SpeechInputPanel'
import { Sizes } from '../../../../../style/Sizes'
import LinearGradient from 'react-native-linear-gradient'
import { ZIndices } from '../zIndices'


const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fitParent,
        ...StyleTemplates.contentVerticalCenteredContainer,
        zIndex: ZIndices.GlobalSpeechOverlay,
        elevation: 8
    },
    popupStyle: {
        backgroundColor: 'white',
        marginLeft: Sizes.horizontalPadding * 2,
        marginRight: Sizes.horizontalPadding * 2,
        borderRadius: 8,
        padding: Sizes.horizontalPadding,
        paddingTop: Sizes.verticalPadding * 0.7,
        shadowColor: '#324749',
        shadowRadius: 8,
        shadowOpacity: 0.3,
        elevation: 8,
    }
})

interface Props {
    isGlobalSpeechButtonPressed: boolean
}

interface State {
    isOverlayRendered: boolean,
    animatedProgress: Animated.Value
}

export class GlobalSpeechOverlay extends React.PureComponent<Props, State> {

    static getDerivedStateFromProps(nextProps: Props, currentState: State): State {
        if (nextProps.isGlobalSpeechButtonPressed === true && currentState.isOverlayRendered === false) {
            return {
                ...currentState,
                animatedProgress: new Animated.Value(0),
                isOverlayRendered: true
            }
        } else return null
    }

    private currentAnimation: Animated.CompositeAnimation

    constructor(props: Props) {
        super(props)
        this.state = {
            isOverlayRendered: props.isGlobalSpeechButtonPressed,
            animatedProgress: new Animated.Value(0)
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.isGlobalSpeechButtonPressed !== this.props.isGlobalSpeechButtonPressed) {
            if (prevProps.isGlobalSpeechButtonPressed === false) {
                //show
                this.currentAnimation?.stop()

                this.state.animatedProgress.setValue(0)
                this.currentAnimation = Animated.timing(this.state.animatedProgress, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                })
                this.currentAnimation.start()


            } else if (prevProps.isGlobalSpeechButtonPressed === true) {
                //hide
                this.currentAnimation?.stop()
                this.currentAnimation = Animated.timing(this.state.animatedProgress, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true
                })
                this.currentAnimation.start(() => {
                    this.setState({
                        ...this.state,
                        isOverlayRendered: false
                    })
                })
            }
        }
    }

    render() {
        return this.state.isOverlayRendered === true ? <View pointerEvents="none" style={styles.containerStyle}>
            {Platform.select({
                ios: <AnimatedLinearGradient style={{
                    ...StyleTemplates.fitParent,
                    opacity: this.state.animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.4]
                    })
                }} colors={["#00000000", "#000000FF"]} />,
                android: <Animated.View style={{
                    ...StyleTemplates.fitParent,
                    backgroundColor: 'black',
                    opacity: this.state.animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.25]
                    })
                }}/>
            })
            }

            <Animated.View key={"global_speech_popup"} style={{
                ...styles.popupStyle,
                transform: [{
                    translateY: this.state.animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                    })
                }],
                opacity: this.state.animatedProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                }),
                shadowOffset: {
                    width: 0, height: this.state.animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8]
                    })
                },
            }}
            >
                <SpeechInputPanel />
            </Animated.View>
        </View> : null
    }
}