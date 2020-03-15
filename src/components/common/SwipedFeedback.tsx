import React from 'react'
import Animated, { Easing } from 'react-native-reanimated'

import { SizeWatcher } from '../visualization/SizeWatcher'
import LinearGradient from 'react-native-linear-gradient'
import { StyleTemplates } from '@style/Styles'
import { Platform } from 'react-native'

interface State {
    swipeDirection: "left" | "right"
    progress: Animated.Value<number>,
    alphaProgress: Animated.Value<number>,
    width: number,
    height: number,
    feedbackShowing: boolean
}

export class SwipedFeedback extends React.PureComponent<any, State>{

    constructor(props: any) {
        super(props)

        this.state = {
            swipeDirection: 'left',
            progress: new Animated.Value(0),
            alphaProgress: new Animated.Value(0),
            width: 0,
            height: 0,
            feedbackShowing: false
        }
    }

    public startFeedback(direction: 'left' | 'right') {
        this.setState({
            ...this.state,
            swipeDirection: direction,
            feedbackShowing: true
        })
        this.state.progress.setValue(0)
        this.state.alphaProgress.setValue(0)
        Animated.timing(this.state.progress, {
            toValue: 1,
            duration: 300,
            easing: Easing.in(Easing.linear)
        }).start()
        Animated.timing(this.state.alphaProgress, {
            toValue: 1,
            duration: Platform.OS === 'ios'? 800 : 600,
            easing: Easing.in(Easing.linear)
        }).start(()=>{
            this.setState({
                ...this.state,
                feedbackShowing: false
            })
        })

    }

    private onSizeChanged = (width: number, height: number) => {
        this.setState({
            ...this.state,
            width,
            height
        })
    }

    render() {
        return <SizeWatcher containerStyle={StyleTemplates.fitParent} onSizeChange={this.onSizeChanged}>
            <Animated.View style={{
                ...StyleTemplates.fitParent,
                opacity: this.state.alphaProgress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),

                transform: [
                    {
                        translateX: this.state.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [this.state.swipeDirection === 'left' ? this.state.width : -this.state.width, 0]
                        }),
                    }
                ]
            } as any}>
                {this.state.feedbackShowing && <LinearGradient
                    colors={this.state.swipeDirection === 'left' ? ['transparent', "white"] : ["white", "transparent"]}
                    style={StyleTemplates.fitParent}
                    start={{ x: this.state.swipeDirection === 'left' ? 0 : 0.7, y: 0 }}
                    end={{ x: this.state.swipeDirection === 'left' ? 0.3 : 1, y: 0 }} />}
            </Animated.View>
        </SizeWatcher>
    }
}