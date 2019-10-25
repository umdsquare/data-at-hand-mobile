import React from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';



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
    transitionValue: Animated.Value
    prevBallInformations: Array<BallInfo>
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
            transitionValue: new Animated.Value(0),
            prevBallInformations: null,
            ballInformations: this.generateBallInfoList(currentIndex, relativeWindowPointer)
        }
    }

    private startAnim() {
        if (this.transitionAnim) {
            this.transitionAnim.stop()
        } else {
            this.state.transitionValue.setValue(0),
                this.transitionAnim = Animated.timing(this.state.transitionValue, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.inOut(Easing.cubic)
                })
            this.transitionAnim.start(() => {
                this.transitionAnim = null
            })
        }
    }

    private onPrevClicked = () => {
        if (this.state.currentIndex > 0) {
            const newIndex = this.state.currentIndex - 1
            const newWindowRelPointer = Math.min(0, (this.state.relativeWindowPointer + 1))
            const previousAbsoluteWindowPointer = this.state.currentIndex + this.state.relativeWindowPointer
            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
                prevBallInformations: this.state.ballInformations,
                ballInformations: this.generateBallInfoList(newIndex, newWindowRelPointer)
            })

            if (previousAbsoluteWindowPointer != newIndex + newWindowRelPointer) {
                //need transition
                this.startAnim()
            } else {
                //don't need transition
                this.state.transitionValue.setValue(1)
            }
        }
    }

    private onNextClicked = () => {
        if (this.state.currentIndex < this.props.numItems - 1) {
            const newIndex = this.state.currentIndex + 1
            const newWindowRelPointer = Math.max(-(this.props.windowSize - 1), (this.state.relativeWindowPointer - 1))
            const previousAbsoluteWindowPointer = this.state.currentIndex + this.state.relativeWindowPointer
            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
                prevBallInformations: this.state.ballInformations,
                ballInformations: this.generateBallInfoList(newIndex, newWindowRelPointer)
            })

            if (previousAbsoluteWindowPointer != newIndex + newWindowRelPointer) {
                //need transition
                this.startAnim()
            } else {
                //don't need transition
                this.state.transitionValue.setValue(1)
            }
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

    private findMatchingPrevisousBallInfo(ballInfo: BallInfo): BallInfo {
        if (this.state.prevBallInformations) {
            return this.state.prevBallInformations.find(info => info.itemIndex === ballInfo.itemIndex)
        } else return null
    }

    private interpolateBallScale = (info: BallInfo) => {
        const prevInfo = this.findMatchingPrevisousBallInfo(info)
        if (prevInfo != null) {
            if (prevInfo.isOutsideWindow === true && info.isOutsideWindow === false) {
                return this.state.transitionValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1]
                })
            } else if (prevInfo.isOutsideWindow === false && info.isOutsideWindow === true) {
                return this.state.transitionValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5]
                })
            }
        }
        return info.isOutsideWindow ? 0.5 : 1
    }

    private interpolateAlpha = (info: BallInfo, index: number) => {
        if (this.state.prevBallInformations) {
            const prevBallIndex = this.state.prevBallInformations.findIndex(inf => inf.itemIndex === info.itemIndex)
            if (prevBallIndex >= 0) {
            } else {
                //no match.
                    return this.state.transitionValue.interpolate({
                        inputRange: [0, 1], outputRange: info.itemExists? [
                            0, 1
                        ]: [1,0]
                    })
            }
        }

        return info.itemExists? 1:0
    }

    private getXOfBall(ballInformations: Array<BallInfo>, infoIndex: number): number {

        const cellWidth = Sizes.ballMargin * 2 + Sizes.ballNormalSize

        const totalWidth = (this.props.windowSize + 2) * cellWidth

        const needLeftSmallDot = ballInformations[0].itemExists === true
        const needRightSmallDot = ballInformations[ballInformations.length - 1].itemExists === true
        const numBallsToShow = ballInformations.length - (needLeftSmallDot ? 0 : 1) - (needRightSmallDot ? 0 : 1)


        return ((totalWidth - numBallsToShow * cellWidth) / 2) + ((infoIndex - (needLeftSmallDot ? 0 : 1)) * cellWidth)
    }

    private interpolateBallPosition = (info: BallInfo, index: number) => {

        const finalPosition = this.getXOfBall(this.state.ballInformations, index)
        if (this.state.prevBallInformations) {
            const prevBallIndex = this.state.prevBallInformations.findIndex(inf => inf.itemIndex === info.itemIndex)
            if (prevBallIndex >= 0) {
                return this.state.transitionValue.interpolate({
                    inputRange: [0, 1], outputRange: [
                        this.getXOfBall(this.state.prevBallInformations, prevBallIndex), finalPosition
                    ]
                })
            } else {
                //no match.
                if (index === 0) {
                    return this.state.transitionValue.interpolate({
                        inputRange: [0, 1], outputRange: [
                            this.getXOfBall(this.state.prevBallInformations, index - 1), finalPosition
                        ]
                    })
                }else if(index === this.state.ballInformations.length -1){
                    return this.state.transitionValue.interpolate({
                        inputRange: [0, 1], outputRange: [
                            this.getXOfBall(this.state.prevBallInformations, index + 1), finalPosition
                        ]
                    })
                }
            }
        }

        return this.state.transitionValue.interpolate({
            inputRange: [0, 1], outputRange: [
                finalPosition, finalPosition
            ]
        })
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
            }}>{this.state.ballInformations.map((info, i) =>
                <Animated.View
                    key={i} style={{
                        position: 'absolute',
                        left: this.interpolateBallPosition(info, i),
                        width: Sizes.ballMargin * 2 + Sizes.ballNormalSize,
                        height: Sizes.ballMargin * 2 + Sizes.ballNormalSize,
                        alignItems: 'center',
                        opacity: this.interpolateAlpha(info, i),
                        justifyContent: 'center'
                    }}>
                    <Animated.View
                        style={{
                            width: Sizes.ballNormalSize,
                            height: Sizes.ballNormalSize,
                            borderRadius: 500,
                            transform: [{ scale: this.interpolateBallScale(info) }],
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