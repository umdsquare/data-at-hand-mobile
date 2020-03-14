import React from 'react';
import { SpeechNotificationEvent } from '../../../core/speech/SpeechEventQueue';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { ZIndices } from './parts/zIndices';
import { StyleTemplates } from '../../../style/Styles';
import { SvgIcon, SvgIconType } from '../../common/svg/SvgIcon';
import { Sizes } from '../../../style/Sizes';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../../style/Colors';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const start = { x: 0, y: 0 }
const end = { x: 1, y: 1 }

const styles = StyleSheet.create({

    containerStyle: {
        position: 'absolute',
        zIndex: ZIndices.TooltipOverlay,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 45,
        alignItems: 'center',
        justifyContent: 'center'
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
    }

})

interface State {
    currentEvent?: SpeechNotificationEvent | null
}

export class SpeechEventNotificationOverlay extends React.PureComponent<{}, State> {

    private readonly eventsInQueue = Array<SpeechNotificationEvent>()

    private readonly animProgress = new Animated.Value(0)
    private readonly iconRotationProgress = new Animated.Value(0)
    private readonly iconScaleProgress = new Animated.Value(0)


    private currentAnimation: Animated.CompositeAnimation | undefined = undefined


    constructor(props) {
        super(props)
        this.state = {
            currentEvent: null
        }
    }

    public notify(event: SpeechNotificationEvent) {
        if(this.eventsInQueue.length > 0){
            this.eventsInQueue.splice(0)
        }
        this.eventsInQueue.push(event)
        if (this.state.currentEvent == null) {
            this.showNext()
        }
    }

    private showNext() {
        if (this.eventsInQueue.length > 0) {
            const currentEvent = this.eventsInQueue.shift()
            this.setState({
                ...this.state,
                currentEvent: currentEvent
            })

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
                    Animated.delay(currentEvent.type === 'success'? 300 : 800),
                    Animated.timing(this.animProgress, {
                        toValue: 0,
                        easing: Easing.cubic,
                        duration: currentEvent.type === 'success'? 400: 600,
                        useNativeDriver: true
                    })
                ]),
                currentEvent.type === 'success'? Animated.sequence([
                    Animated.delay(100),
                    Animated.timing(this.iconRotationProgress,
                        {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        })
                ]) : undefined,
                Animated.sequence([
                    Animated.delay(currentEvent.type === 'success'? 100: 0),
                    Animated.timing(this.iconScaleProgress, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.elastic(currentEvent.type === 'success'? 3: 1)
                    })
                ])

            ])

            this.currentAnimation.start(() => {
                this.showNext()
            })
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
        return <View pointerEvents="none" style={styles.containerStyle}>
            {this.state.currentEvent != null ? <AnimatedLinearGradient style={[
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
                colors={this.state.currentEvent.type === 'success'? Colors.speechSuccessGradient : Colors.speechFailGradient}
                start={start} end={end}
            >
                <Animated.View style={
                    {
                        transform: [{
                            rotate: this.iconRotationProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 2*Math.PI]
                            })
                        },
                        {
                            scale: this.iconScaleProgress
                        }]
                    }
                }>
                    <SvgIcon type={this.state.currentEvent.type === 'success' ?
                        SvgIconType.Check : SvgIconType.QuestionMark}
                        color={'white'} size={this.state.currentEvent.type === 'success' ? 34 : 28} />
                </Animated.View>


                <Text style={{ marginLeft: 8, color: 'white', fontSize: Sizes.normalFontSize }}>{this.state.currentEvent.type === 'success'? 'Got it.' : "Sorry, I didn\'t get."}</Text>
            </AnimatedLinearGradient> : null}
        </View>
    }
}