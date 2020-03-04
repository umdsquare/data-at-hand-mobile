import React from 'react';
import { StyleSheet, View, LayoutAnimation } from 'react-native';
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
    buttonStyle?: any,
    index: number
}

interface State {
    relativeWindowPointer: number // index of leftmost point of the window relative to currentIndex. Always -(windowSize-1) <= value <= 0
    currentIndex: number
}

interface BallInfo {
    itemIndex: number
    isOutsideWindow: boolean,
    itemExists: boolean
}

export class PaginationBar extends React.PureComponent<Props, State>{

    constructor(props: Props) {
        super(props)

        const relativeWindowPointer = props.orientedAtEnd === true ? -(props.windowSize - 1) : 0
        const currentIndex = props.index? props.index : (props.orientedAtEnd === true ? props.numItems - 1 : 0)

        this.state = {
            relativeWindowPointer: relativeWindowPointer,
            currentIndex: currentIndex
        }
    }

    componentDidUpdate(prevProps: Props){
        if(this.props.numItems != prevProps.numItems || this.props.index != prevProps.index){
            let windowRelPointer = this.state.relativeWindowPointer
            let newIndex = this.props.index

            this.setState({
                ...this.state,
                currentIndex: newIndex, 
                relativeWindowPointer: windowRelPointer - (newIndex + windowRelPointer + this.props.windowSize - this.props.numItems)
            })
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    private onPrevClicked = () => {
        if (this.state.currentIndex > 0) {
            const newIndex = this.state.currentIndex - 1
            const newWindowRelPointer = Math.min(0, (this.state.relativeWindowPointer + 1))

            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
            })
        }
    }

    private onNextClicked = () => {
        if (this.state.currentIndex < this.props.numItems - 1) {
            const newIndex = this.state.currentIndex + 1
            const newWindowRelPointer = Math.max(-(this.props.windowSize - 1), (this.state.relativeWindowPointer - 1))

            this.setState({
                ...this.state,
                relativeWindowPointer: newWindowRelPointer,
                currentIndex: newIndex,
            })
        }
    }

    private generateBallInfoList(currentIndex: number, relativeWindowPointer: number): Array<BallInfo> {
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

    render() {
        const ballInformations = this.generateBallInfoList(this.state.currentIndex, this.state.relativeWindowPointer)

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
                flexDirection: 'row',
                width: (this.props.windowSize + 2) * (2 * Sizes.ballMargin + Sizes.ballNormalSize),
                height: 40,
                alignItems: "center",
                justifyContent: 'center'
            }}>{ballInformations.map((info, i) =><View
                    key={info.itemIndex} style={{
                        width: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 ),
                        height: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 ),
                        margin: Sizes.ballMargin,
                        borderRadius: Sizes.ballNormalSize * (info.isOutsideWindow===true ? 0.5 : 1 )*.5,
                        backgroundColor: info.itemIndex === this.state.currentIndex ? Colors.accent : "gray",
                        alignItems: 'center',
                        opacity: info.itemExists ? 1 : 0,
                        justifyContent: 'center'
                    }}/>
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