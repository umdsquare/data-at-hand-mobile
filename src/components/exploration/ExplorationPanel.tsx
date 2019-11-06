import React from 'react';
import { StyleSheet, View, Text, TextInput, Alert } from 'react-native';
import { StyleTemplates } from '../../style/Styles';
import Colors from '../../style/Colors';
import { BookmarkToggle } from '../common/BookmarkToggle';
import { PaginationBar } from '../common/PaginationBar';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Dialog from "react-native-dialog";
import { Button } from 'react-native-elements';
import { ExplorationStateInfo, isVisualizationPayload, VisualizationPayload } from '../../core/interaction/types';
import { ReduxAppState } from '../../state/types';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { ChartView } from '../visualization/ChartView';


const headerHeight = 52
const footerHeight = 48
const horizontalPaddingWithIcon = 8

const Styles = StyleSheet.create({
    cardStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        ...StyleTemplates.backgroundCardStyle,
        backgroundColor: Colors.lightBackground,
        shadowRadius: 2,
        borderRadius: 0,
        flexDirection: 'column',
    },

    headerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: horizontalPaddingWithIcon,
        paddingRight: horizontalPaddingWithIcon
    },

    bookmarkIconStyle: {
        marginRight: 6,
    },

    bookmarkActiveTextStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: "#909090",
    },

    bookmarkInactiveTextStyle: {
        fontSize: 18,
        fontWeight: '300',
        color: "#a0a0a0",
    },


    headerButtonStyle: {
        width: headerHeight * 0.8,
        height: headerHeight
    },

    bodyStyle: {
        flex: 1
    },

    footerStyle: {
        height: footerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 4,
        paddingRight: 4,
    },

    footerButtonStyle: {
        width: footerHeight,
        height: footerHeight
    },

    hrStyle: {
        alignSelf: 'stretch',
        marginLeft: 12,
        marginRight: 12,
        marginBottom: 3,
        height: 1,
        backgroundColor: "#d0d0d0",
    },

    cardMessageStyle: {
        alignSelf: 'center',
        padding: 24,
        fontSize: 18,
        color: Colors.link,
        fontWeight: 'bold',
    },

    bookmarkButtonContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center'
    }
})

interface Props {
    explorationStateInfo?: ExplorationStateInfo
}

interface State {
    bookmarkInfo: { name: string },
    numItems: number
}

class ExplorationPanel extends React.Component<Props, State> {


    constructor(props) {
        super(props)
        this.state = {
            bookmarkInfo: null,
            numItems: 0
        }
    }

    render() {
        return (<View style={Styles.cardStyle} removeClippedSubviews={true}>
            <View style={Styles.headerStyle}>

                <BookmarkButton bookmarkInfo={this.state.bookmarkInfo} onBookmarkRequested={(name) => {
                    this.setState({ ...this.state, bookmarkInfo: { name: name } })
                }}

                    onDiscardBookmarkRequested={() => {
                        this.setState({ ...this.state, bookmarkInfo: null })
                    }} />

            </View>

            <View style={Styles.bodyStyle}>
                {
                    isVisualizationPayload(this.props.explorationStateInfo.payload)==true? 
                    <ChartView schema={(this.props.explorationStateInfo.payload as VisualizationPayload).visualizationSchema}/> : <></>
                }
            </View>

            <Text style={Styles.cardMessageStyle}>Your average step count is 10,000.</Text>

            <View style={Styles.hrStyle} />

            <View style={Styles.footerStyle}>

                <PaginationBar buttonStyle={Styles.footerButtonStyle} orientedAtEnd={true} numItems={this.state.numItems} index={this.state.numItems - 1} windowSize={5} />

            </View>
        </View>)
    }
}

function mapStateToProps(state: ReduxAppState, ownProps: Props): Props {

    return {
        ...ownProps,
        explorationStateInfo: state.explorationState.info
    }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return { ...ownProps }
}

const explorationPanel = connect(mapStateToProps, mapDispatchToProps)(ExplorationPanel)
export { explorationPanel as ExplorationPanel }


interface BookmarkButtonProps {
    bookmarkInfo: { name: string },
    onBookmarkRequested: (name: string) => void
    onDiscardBookmarkRequested: () => void
}

interface BookmarkButtonState {
    bookmarkDialogVisible: boolean,
    bookmarkDialogInput: string,
}

class BookmarkButton extends React.PureComponent<BookmarkButtonProps, BookmarkButtonState>{
    private textInput: TextInput

    constructor(props) {
        super(props)
        this.state = {
            bookmarkDialogVisible: false,
            bookmarkDialogInput: null
        }
    }

    private onPressed = () => {
        if (this.props.bookmarkInfo == null) {
            this.setState({ bookmarkDialogVisible: true })
        } else {
            Alert.alert("Discard the bookmark?", null, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: this.props.onDiscardBookmarkRequested }
            ], { cancelable: true })
        }
    }

    private closeDialog = () => {
        this.setState({ bookmarkDialogVisible: false })
    }

    private onCreatePressed = () => {
        this.props.onBookmarkRequested(this.state.bookmarkDialogInput.trim())
        this.closeDialog()
    }

    private isInputValid = () => {
        return this.state.bookmarkDialogInput != null && this.state.bookmarkDialogInput.trim().length > 0
    }

    render() {
        return <TouchableOpacity onPress={this.onPressed} style={Styles.bookmarkButtonContainerStyle}>
            <BookmarkToggle buttonStyle={Styles.headerButtonStyle}
                isBookmarked={this.props.bookmarkInfo != null}
            />
            <Text style={this.props.bookmarkInfo != null ? Styles.bookmarkActiveTextStyle : Styles.bookmarkInactiveTextStyle}>
                {this.props.bookmarkInfo ? this.props.bookmarkInfo.name : "Tap to bookmark"}
            </Text>
            <Dialog.Container visible={this.state.bookmarkDialogVisible} onShow={() => { this.textInput.focus() }}>
                <Dialog.Title>Bookmark New Card</Dialog.Title>
                <Dialog.Input
                    placeholder="Insert bookmark name"
                    textInputRef={ref => this.textInput = ref}
                    value={this.state.bookmarkDialogInput}
                    onChangeText={input => this.setState({ ...this.state, bookmarkDialogInput: input })}
                    onSubmitEditing={this.onCreatePressed}
                />
                <Dialog.Button label="Cancel" onPress={this.closeDialog} />
                <Dialog.Button label="Add"
                    color={this.isInputValid() === true ? Colors.link : "#a0a0a0"}
                    disabled={this.isInputValid() === false}
                    onPress={this.onCreatePressed} />

            </Dialog.Container>
        </TouchableOpacity>
    }
}