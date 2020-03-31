import React from 'react'
import { Animated, Easing } from 'react-native'

import LinearGradient from 'react-native-linear-gradient'
import { StyleTemplates } from '@style/Styles'
import { Platform, Dimensions } from 'react-native'
import Colors from '@style/Colors'
import { Lazy } from '@data-at-hand/core/utils'

interface State {
    swipeDirection: "left" | "right"
    progress: Animated.Value,
    feedbackShowing: boolean
}

const width = Dimensions.get('window').width

export class SwipedFeedback extends React.PureComponent<any, State>{

    private static animConfig = new Lazy(()=>({
        toValue: 1,
        duration: Platform.OS === 'ios'? 800 : 600,
        easing: Easing.in(Easing.linear),
        useNativeDriver: true
    }))

    constructor(props: any) {
        super(props)

        this.state = {
            swipeDirection: 'left',
            progress: new Animated.Value(0),
            feedbackShowing: false,
        }
    }

    public startFeedback(direction: 'left' | 'right') {


        this.state.progress.stopAnimation()
        this.state.progress.setValue(0)

        this.setState({
            ...this.state,
            swipeDirection: direction,
            feedbackShowing: true
        })

        Animated.timing(this.state.progress, SwipedFeedback.animConfig.get()).start(()=>{
            this.setState({
                ...this.state,
                feedbackShowing: false
            })
        })

    }

    render() {
        return <Animated.View pointerEvents='none' style={{
                ...StyleTemplates.fitParent,
                opacity: this.state.progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),

                transform: [
                    {
                        translateX: this.state.progress.interpolate({
                            inputRange: [0, 0.4],
                            outputRange: [this.state.swipeDirection === 'left' ? width : -width, 0],
                            extrapolate: 'clamp'
                        }),
                    }
                ]
            } as any}>
                {this.state.feedbackShowing === true && <LinearGradient
                    colors={this.state.swipeDirection === 'left' ? ['transparent', Colors.WHITE] : [Colors.WHITE, "transparent"]}
                    style={StyleTemplates.fitParent}
                    start={{ x: this.state.swipeDirection === 'left' ? 0 : 0.7, y: 0 }}
                    end={{ x: this.state.swipeDirection === 'left' ? 0.3 : 1, y: 0 }} />}
            </Animated.View>
    }
}