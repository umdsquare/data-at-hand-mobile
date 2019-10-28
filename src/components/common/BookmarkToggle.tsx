import React from 'react';
import { Animated, Easing } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import Colors from '../../style/Colors';

interface Props {
    isBookmarked: boolean,
    onToggle: (boolean) => void,
    buttonStyle?: any
}

interface State {
    isBookmarked: boolean,
    animationTransition: Animated.Value
}

export class BookmarkToggle extends React.PureComponent<Props, State> {

    private currentAnimation: Animated.CompositeAnimation

    constructor(props: Props) {
        super(props)
        this.state = {
            isBookmarked: props.isBookmarked,
            animationTransition: new Animated.Value(1)
        }
    }

    private onPressed = () => {
        this.setState({
            ...this.state,
            isBookmarked: !this.state.isBookmarked
        })
        if (this.currentAnimation) {
            this.currentAnimation.stop()
        }
        this.state.animationTransition.setValue(0)
        this.currentAnimation = Animated.timing(this.state.animationTransition, {
            toValue: 1,
            duration: 400,
            easing: Easing.elastic(2)
        })

        this.currentAnimation.start(() => {
            this.currentAnimation = null
        })
    }

    render() {
        return (<Button
            buttonStyle={this.props.buttonStyle}
            type="clear"
            onPress={this.onPressed}
            icon={
                <Animated.View
                    style={{ transform: [{ scale: this.state.animationTransition }] }}
                >
                    <Icon {...{
                        name: this.state.isBookmarked === true ? "bookmark" : "bookmark-border",
                        type: 'materialicon', color: this.state.isBookmarked === true ? Colors.primary : 'gray', size: 26
                    }} />
                </Animated.View>

            } />
        )
    }
}