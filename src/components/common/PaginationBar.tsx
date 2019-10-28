import React from 'react';
import { StyleSheet, View, Animated, Easing, Platform, UIManager, LayoutAnimation } from 'react-native';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Sizes = {
    ballNormalSize: 8,
    ballMargin: 3
}

const Styles = StyleSheet.create({
    containerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonDisabledStyle: {
        opacity: 0.3
    },
})

interface Props {
    numItems: number,
    windowSize: number,
    orientedAtEnd?: boolean,
    containerStyle?: any,
    buttonStyle?: any
}

interface State {
    relativeWindowPointer: number // index of leftmost point of the window relative to currentIndex. Always -(windowSize-1) <= value <= 0
    currentIndex: number
    ballInformations: Array<BallInfo>
}

interface BallInfo {
    itemIndex: number
    isOutsideWindow: boolean
    itemExists: boolean
}

export class PaginationBar extends React.PureComponent<Props, State>{

    private transitionAnim: Animated.CompositeAnimation

    constructor(props: Props) {
        super(props)

        const relativeWindowPointer = props.orientedAtEnd === true ? -(props.windowSize - 1) : 0
        const currentIndex = props.orientedAtEnd === true ? props.numItems - 1 : 0

        this.state = {
            relativeWindowPointer: relativeWindowPointer,
            currentIndex: currentIndex,
            ballInformations: this.generateBallInfoList(currentIndex, relativeWindowPointer)
        }
    }

    private onPrevClicked = () => {
        if (this.state.currentIndex > 0) {
            const newIndex = this.state.currentIndex - 1
            const newWindowRelPointer = Math.min(0, (this.state.relativeWindowPointer + 1))

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
                ballInformations: this.generateBallInfoList(newIndex, newWindowRelPointer)
            })
        }
    }

    private onNextClicked = () => {
        if (this.state.currentIndex < this.props.numItems - 1) {
            const newIndex = this.state.currentIndex + 1
            const newWindowRelPointer = Math.max(-(this.props.windowSize - 1), (this.state.relativeWindowPointer - 1))

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
                ballInformations: this.generateBallInfoList(newIndex, newWindowRelPointer)
            })
        }
    }

    private generateBallInfoList(currentIndex, relativeWindowPointer): Array<BallInfo> {
        const currentWindowAbsolutePointer = currentIndex + relativeWindowPointer
        const ballInformations: Array<BallInfo> = []

        if (this.props.numItems <= this.props.windowSize) {
            for (let i = 0; i < this.props.numItems; i++) {
                ballInformations.push({
                    itemIndex: i,
                    isOutsideWindow: false,
                    itemExists: true
                })
            }
        } else {
            for (let i = -1; i < this.props.windowSize + 1; i++) {
                const itemIndex = i + currentWindowAbsolutePointer
                ballInformations.push({
                    itemIndex: itemIndex,
                    isOutsideWindow: i < 0 || i >= this.props.windowSize,
                    itemExists: itemIndex >= 0 && itemIndex < this.props.numItems
                })
            }
        }

        return ballInformations
    }

    private getXOfBall(ballInformations: Array<BallInfo>, infoIndex: number): number {

        const cellWidth = Sizes.ballMargin * 2 + Sizes.ballNormalSize

        const totalWidth = (this.props.windowSize + 2) * cellWidth

        const needLeftSmallDot = ballInformations[0].itemExists === true
        const needRightSmallDot = ballInformations[ballInformations.length - 1].itemExists === true
        const numBallsToShow = ballInformations.length - (needLeftSmallDot ? 0 : 1) - (needRightSmallDot ? 0 : 1)


        return ((totalWidth - numBallsToShow * cellWidth) / 2) + ((infoIndex - (needLeftSmallDot ? 0 : 1)) * cellWidth)
    }

    render() {
        return (<View style={{ ...Styles.containerStyle, ...this.props.containerStyle }}>

            <Button
                disabled={this.state.currentIndex <= 0}
                disabledStyle={Styles.buttonDisabledStyle}
                buttonStyle={{ ...this.props.buttonStyle }}
                type="clear"
                icon={{ name: "keyboard-arrow-left", type: 'materialicon', color: 'gray' }}
                onPress={this.onPrevClicked}
            />

            <View style={{
                width: (this.props.windowSize + 2) * (2 * Sizes.ballMargin + Sizes.ballNormalSize),
                height: 40,
                alignItems: "center",
                justifyContent: 'center'
            }}>{this.state.ballInformations.map((info, i) =><Animated.View
                    key={info.itemIndex} style={{
                        position: 'absolute',
                        left: this.getXOfBall(this.state.ballInformations, i),
                        width: Sizes.ballMargin * 2 + Sizes.ballNormalSize,
                        height: Sizes.ballMargin * 2 + Sizes.ballNormalSize,
                        alignItems: 'center',
                        opacity: info.itemExists ? 1 : 0,
                        justifyContent: 'center'
                    }}>
                    <Animated.View
                        style={{
                            width: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 ),
                            height: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 ),
                            borderRadius: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 )*.5,
                            backgroundColor: info.itemIndex === this.state.currentIndex ? Colors.accent : "gray"
                        }} />
                </Animated.View>
            )}</View>

            <Button
                disabled={this.state.currentIndex >= this.props.numItems - 1}
                disabledStyle={Styles.buttonDisabledStyle}
                buttonStyle={{ ...this.props.buttonStyle }}
                type="clear"
                icon={{ name: "keyboard-arrow-right", type: 'materialicon', color: 'gray' }}
                onPress={this.onNextClicked}
            />
        </View>)
    }
}