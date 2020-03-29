import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { StyleTemplates } from '@style/Styles';
import { SafeAreaConsumer } from 'react-native-safe-area-context';
import { TapGestureHandler, TapGestureHandlerStateChangeEvent, State as GestureState } from 'react-native-gesture-handler';
import { ZIndices } from '../pages/exploration/parts/zIndices';
import Colors from '@style/Colors';

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fitParent,
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        zIndex: ZIndices.Header,
        elevation: 10
    },

    backdropStyle: {
        ...StyleTemplates.fitParent,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },

    panelStyle: {
        backgroundColor: Colors.WHITE,
        alignSelf: 'stretch',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingTop: 16,
    }
})

interface Props {
    childrem?: any
}

interface State {
    isShown: boolean,
}

export class TouchSafeBottomSheet extends React.PureComponent<Props, State> {

    private appearProgress: Animated.Value = new Animated.Value(0)

    private animation: Animated.CompositeAnimation | null = null

    constructor(props: Props) {
        super(props)

        this.state = {
            isShown: false,
        }
    }

    public open() {
        this.setState({
            ...this.state,
            isShown: true
        })
        this.animation?.stop()
        this.animation = Animated.timing(this.appearProgress, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        })

        this.animation.start()
    }

    public close() {
        this.animation?.stop()

        this.animation = Animated.timing(this.appearProgress, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        })

        this.animation.start(() => {
            this.setState({
                ...this.state,
                isShown: false
            })
        })
    }

    private readonly onBackdropClick = (ev: TapGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            this.close()
        }
    }

    render() {
        if (this.state.isShown === true) {
            return <View style={styles.containerStyle}>
                <TapGestureHandler onHandlerStateChange={this.onBackdropClick} maxDurationMs={Number.MAX_VALUE}>
                    <Animated.View style={{
                        ...styles.backdropStyle,
                        opacity: this.appearProgress
                    }}></Animated.View>
                </TapGestureHandler>


                <Animated.View style={{
                    ...styles.panelStyle,

                    opacity: this.appearProgress,
                    transform: [{
                        translateY: this.appearProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0]
                        })
                    }]
                }}>
                    <SafeAreaConsumer>
                        {
                            insets => <View style={{
                                paddingBottom: Math.max(20, insets!.bottom)
                            }}>
                                {
                                    this.props.children
                                }
                            </View>
                        }
                    </SafeAreaConsumer>
                </Animated.View>
            </View>
        } else return <></>
    }
}