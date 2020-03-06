import React from 'react';
import { Button, Icon } from 'react-native-elements';
import Colors from '../../style/Colors';
import { Animated, Easing } from 'react-native';

export enum Valence {
    Neutral = 0,
    Positive = 1,
    Negative = -1
}

interface Props {
    valence?: Valence,
    onValenceChanged?: (valence: Valence) => void,
    buttonStyle: any,
    containerStyle: any
}

interface State {
    valence: Valence
    leanToPositive: boolean
    heartInterpolation: Animated.Value
}

export class LikeHeart extends React.PureComponent<Props, State>{

    private currentAnimation: Animated.CompositeAnimation | null = null

    constructor(props: Props) {
        super(props)
        this.state = {
            valence: props.valence || 0,
            leanToPositive: true,
            heartInterpolation: new Animated.Value(1)
        }
    }

    private stopAnimation() {
        if (this.currentAnimation) {
            this.currentAnimation.stop()
            this.currentAnimation = null
        }
    }

    private onToggle = () => {
        this.stopAnimation()
        let newValence: Valence
        switch (this.state.valence) {
            case Valence.Neutral:
                newValence = this.state.valence + (this.state.leanToPositive === true ? 1 : -1)

                if (newValence === Valence.Positive) {
                    this.state.heartInterpolation.setValue(0);
                    Animated.timing(this.state.heartInterpolation, { toValue: 1, duration: 600, easing: Easing.elastic(4) }).start(()=>{
                        this.currentAnimation = null
                    })
                }
                this.setState({
                    ...this.state,
                    valence: newValence,
                })
                break;
            case Valence.Positive:
                newValence = Valence.Neutral
                this.state.heartInterpolation.setValue(1)
                this.setState({
                    ...this.state,
                    valence: newValence,
                    leanToPositive: false,
                })
                break;
            case Valence.Negative:
                newValence = Valence.Neutral
                this.state.heartInterpolation.setValue(1)
                this.setState({
                    ...this.state,
                    valence: newValence,
                    leanToPositive: true
                })
                break;
        }

        if (this.props.onValenceChanged) {
            this.props.onValenceChanged(newValence)
        }
    }

    render() {

        const icon = { name: "ios-heart-empty", type: 'ionicon', color: 'gray' }
        switch (this.state.valence) {
            case Valence.Negative:
                icon.name = "ios-heart-dislike"
                break;
            case Valence.Neutral:
                icon.name = "ios-heart-empty"
                break;
            case Valence.Positive:
                icon.name = "ios-heart"
                icon.color = Colors.red
                break;
        }

        return (<Button
            containerStyle={this.props.containerStyle}
            buttonStyle={this.props.buttonStyle}
            //ios-heart-empty, ios-heart, ios-haert-dislike
            type="clear" icon={<Animated.View style={{ transform: [{ scale: this.state.heartInterpolation }] }}>
                <Icon {...icon} /></Animated.View>}
            onPress={this.onToggle}
        />)
    }
}