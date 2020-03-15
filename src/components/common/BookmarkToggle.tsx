import React from 'react';
import { Animated, Easing } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import Colors from '@style/Colors';

interface Props {
    isBookmarked: boolean,
    disabled?: boolean,
    buttonStyle?: any
}

interface State {
    animationTransition: Animated.Value
}

export class BookmarkToggle extends React.PureComponent<Props, State> {

    private currentAnimation: Animated.CompositeAnimation|null = null

    constructor(props: Props) {
        super(props)
        this.state = {
            animationTransition: new Animated.Value(1)
        }
    }

    componentDidUpdate(prevProp: Props){
        if(prevProp.isBookmarked != this.props.isBookmarked) {
            this.currentAnimation?.stop()
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
    }

    render() {
        return (<Animated.View
                    style={{
                        ...this.props.buttonStyle, 
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ scale: this.state.animationTransition }] }}
                >
                    <Icon {...{
                        name: this.props.isBookmarked === true ? "bookmark" : "bookmark-border",
                        type: 'materialicon', color: this.props.isBookmarked === true ? Colors.primary : 'gray', size: 26
                    }} />
                </Animated.View>
        )
    }
}