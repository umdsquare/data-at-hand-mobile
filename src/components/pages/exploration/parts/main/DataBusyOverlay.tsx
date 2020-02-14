import React from 'react';
import { StyleTemplates } from '../../../../../style/Styles';
import { ViewStyle } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { ZIndices } from '../zIndices';

const styleBase = { ...StyleTemplates.fitParent, backgroundColor: 'white', zIndex: ZIndices.dataBusyOverlay, elevation: 4 } as ViewStyle

interface Props {
    isBusy: boolean
}

interface State {
    isRendered: boolean,
    appearAnimProgress: Animated.Value<number>
}

export class DataBusyOverlay extends React.Component<Props, State>{


    static getDerivedStateFromProps(nextProps: Props, currentState: State): State {
        if (nextProps.isBusy === true && currentState.isRendered === false) {
            return {
                ...currentState,
                appearAnimProgress: new Animated.Value(0),
                isRendered: true
            }
        } else return null
    }

    constructor(props: Props) {
        super(props)

        this.state = {
            isRendered: props.isBusy,
            appearAnimProgress: new Animated.Value(0)
        }

    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.isBusy !== this.props.isBusy) {
            if (this.props.isBusy === true) {
                Animated.timing(this.state.appearAnimProgress, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.linear
                }).start()
            } else {
                Animated.timing(this.state.appearAnimProgress, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.linear
                }).start(() => {
                    this.setState({
                        ...this.state,
                        isRendered: false
                    })
                })
            }
        }
    }

    render() {
        return <Animated.View
            pointerEvents={this.state.isRendered === true ? 'auto' : 'none'}
            style={{
                ...styleBase,
                opacity: this.state.appearAnimProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] })
            }} />
    }
}