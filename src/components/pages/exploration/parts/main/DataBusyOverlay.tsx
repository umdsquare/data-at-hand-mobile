import React from 'react';
import { StyleTemplates } from '@style/Styles';
import { ViewStyle, Animated, Easing } from 'react-native';
import { ZIndices } from '../zIndices';
import Colors from '@style/Colors';
import { Lazy } from '@utils/utils';

const styleBase = { ...StyleTemplates.fitParent, backgroundColor: Colors.WHITE, zIndex: ZIndices.dataBusyOverlay, elevation: 4 } as ViewStyle

interface Props {
    isBusy: boolean
}

interface State {
    isRendered: boolean,
    appearAnimProgress: Animated.Value
}

export class DataBusyOverlay extends React.PureComponent<Props, State>{

    static appearAnimInfo = new Lazy(() => ({
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true
    }))

    static disappearAnimInfo = new Lazy(() => ({
        toValue: 0,
        duration: 250,
        easing: Easing.linear,
        useNativeDriver: true
    }))

    static getDerivedStateFromProps(nextProps: Props, currentState: State): State {
        if (nextProps.isBusy === true && currentState.isRendered === false) {
            return {
                ...currentState,
                appearAnimProgress: new Animated.Value(0),
                isRendered: true
            }
        } else return null
    }

    private animation: Animated.CompositeAnimation

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
                this.animation?.stop()
                this.animation = Animated.timing(this.state.appearAnimProgress, DataBusyOverlay.appearAnimInfo.get())
                this.animation.start()
            } else {
                this.animation?.stop()
                this.animation = Animated.timing(this.state.appearAnimProgress, DataBusyOverlay.disappearAnimInfo.get())
                this.animation.start(() => {
                    this.animation = null
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