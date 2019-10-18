import React from 'react';
import { Animated, Easing } from 'react-native';

interface Props{
    style?:any,
    fadeAlpha?: number
}

interface State{
    alphaInterpolation: Animated.Value
}

export class DarkOverlay extends React.Component<Props, State>{

    private anim: Animated.CompositeAnimation

    constructor(props){
        super(props)

        this.state = {
            alphaInterpolation: new Animated.Value(0)
        }
    }

    show(){
        if(this.anim){
            this.anim.stop()
        }
        this.anim = Animated.timing(this.state.alphaInterpolation, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.cubic)
        })
        this.anim.start(()=>{
            this.anim = null
        })
    }

    hide(){
        if(this.anim){
            this.anim.stop()
        }

        this.anim = Animated.timing(this.state.alphaInterpolation, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.cubic)
        })
        this.anim.start(()=>{
            this.anim = null
        })
    }

    render(){
        return (<Animated.View style={{
            position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, backgroundColor: '#24252b', 
            opacity: this.state.alphaInterpolation.interpolate({
                inputRange: [0, 1], outputRange: [0,this.props.fadeAlpha || 0.25]
            }),
            ...this.props.style
        }}/>
        )
    }
}