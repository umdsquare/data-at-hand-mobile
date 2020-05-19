import React from 'react'
import Modal from "react-native-modal";
import { StyleTemplates } from '@style/Styles';
import { View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

interface Props {
    closeOnBackdropPress?: boolean
    children?: any
}

interface State {
    isVisible: boolean
}

export class BottomSheet extends React.Component<Props, State>{

    constructor(props: Props) {
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
            propagateSwipe={true}
            onBackdropPress={this.onBackdropPress}
            style={StyleTemplates.bottomSheetModalContainerStyle}
            backdropOpacity={0.3}
            >
            <SafeAreaInsetsContext.Consumer>
                {
                    insets => <View style={{
                        ...StyleTemplates.bottomSheetModalViewStyle, paddingBottom: Math.max(20, insets!.bottom)
                    }}>
                        {
                            this.props.children
                        }
                    </View>
                }
            </SafeAreaInsetsContext.Consumer>
        </Modal>
    }
}