import React from 'react'
import Modal from "react-native-modal";
import { StyleTemplates } from '../../style/Styles';
import { SafeAreaConsumer } from "react-native-safe-area-context";
import { View, ViewStyle } from 'react-native';
import Insets from 'react-native-static-safe-area-insets'

interface Props {
    closeOnBackdropPress?: boolean
    children?: any
}

interface State {
    isVisible: boolean
}

const style = {
    ...StyleTemplates.bottomSheetModalViewStyle, paddingBottom: Math.max(20, Insets.safeAreaInsetsBottom)
} as ViewStyle

export class BottomSheet extends React.Component<Props, State>{

    constructor(props) {
        super(props)

        this.state = {
            isVisible: false
        }
    }

    public close() {
        this.setState({
            ...this.state,
            isVisible: false
        })
    }

    public open() {
        this.setState({
            ...this.state,
            isVisible: true
        })
    }

    private onBackdropPress = () => {
        if (this.props.closeOnBackdropPress !== false) {
            this.close()
        }
    }

    render() {
        return <Modal isVisible={this.state.isVisible}
            onBackdropPress={this.onBackdropPress}
            style={StyleTemplates.bottomSheetModalContainerStyle}
            backdropOpacity={0.3}>
            <View style={style}>
                {
                    this.props.children
                }
            </View>
        </Modal>
    }
}