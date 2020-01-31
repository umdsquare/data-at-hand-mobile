import { PropsWithNavigation } from "../../../PropsWithNavigation";
import React from "react";
import { StatusBar, View, StyleSheet, Platform, LayoutAnimation } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
import { ExplorationState } from "../../../state/exploration/interaction/reducers";
import { ThunkDispatch } from "redux-thunk";
import { ReduxAppState } from "../../../state/types";
import { connect } from "react-redux";
import { generateHeaderView } from "./parts/header";
import { BottomBar } from "../../exploration/BottomBar";
import { explorationInfoHelper } from "../../../core/exploration/ExplorationInfoHelper";
import { DataServiceManager } from "../../../system/DataServiceManager";
import { ExplorationInfo, ExplorationType, ExplorationMode } from "../../../core/exploration/types";
import { ExplorationDataState, startLoadingForInfo } from "../../../state/exploration/data/reducers";
import { ExplorationAction, InteractionType, createGoToBrowseOverviewAction, createRestorePreviousInfoAction } from "../../../state/exploration/interaction/actions";
import { Button } from "react-native-elements";
import { Sizes } from "../../../style/Sizes";
import { OverviewMainPanel } from "./parts/main/OverviewMainPanel";
import { BrowseRangeMainPanel } from "./parts/main/BrowseRangeMainPanel";
var deepEqual = require('deep-equal');

const styles = StyleSheet.create({

    headerContainerStyle: {
        backgroundColor: Colors.headerBackground,
    },

    mainContainerStyle: {
        ...StyleTemplates.screenDefaultStyle,
        backgroundColor: "#EFEFF4",
        zIndex: Platform.OS === 'android' ? 100 : undefined,
    },

    historyPanelStyle: {
        position: 'absolute',
        right: Sizes.horizontalPadding - 4,
        bottom: Sizes.horizontalPadding,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'flex-end'
    },

    historyButtonStyle: {
        borderRadius: 50,
        height: 38, padding: 0,
        backgroundColor: Colors.primary + "ee",
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 3,
        paddingLeft: 8,
        paddingRight: 16
    },

    historyButtonContainerStyle: {
        paddingLeft: 4,
        paddingRight: 4
    },

    historyButtonTitleStyle: {
        fontSize: Sizes.smallFontSize,
        color: 'white',
        fontWeight: 'bold'
    }
})

const historyIconStyle = { type: 'ionicon', name: "ios-undo", color: 'white', size: 20 }
const undoIconStyle = { ...historyIconStyle, type: 'fontawesome', name: "undo" }
const redoIconStyle = { ...historyIconStyle, name: "ios-redo" }


export interface ExplorationProps extends PropsWithNavigation {
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState,
    selectedServiceKey: string,
    dispatchCommand: (command: ExplorationAction) => void,
    dispatchDataReload: (info: ExplorationInfo) => void
}

interface State {
}


class ExplorationScreen extends React.Component<ExplorationProps, State> {

    /*
     <View style={{ padding: 12, flexDirection: 'row' }}>
                            <Text style={{ flex: 1 }}>Browse</Text>
                            <Button onPress={() => {
                                this.props.navigation.navigate("Settings")
                            }}></Button>
                        </View>
    
                        <CategoricalRow title="DataSource" showBorder = {true} value="Step Count" icon={<DataSourceIcon type="step" color="white" size={20}/>}/>
                        <CategoricalRow title="Comparison Type" showBorder = {false} value="Two Date Ranges"/>
    
                        <DateRangeBar from={startOfMonth(new Date())} to={endOfMonth(new Date())} onRangeChanged={(from, to) => {
                            console.log("set to ", from, to)
                        }} />
    */

    componentDidMount() {

        if (this.props.selectedServiceKey) {
            DataServiceManager.getServiceByKey(this.props.selectedServiceKey).activateInSystem().then(() => {
                console.log("activated ", this.props.selectedServiceKey, "successfully.")
                this.props.dispatchDataReload(this.props.explorationState.info)
            }).catch(error => {
                console.log("service activation error: ", this.props.selectedServiceKey, error)
            })
        }
    }

    async componentDidUpdate(prevProps: ExplorationProps) {
        if (this.props.explorationState.info.type !== prevProps.explorationState.info.type || deepEqual(prevProps.explorationState.info.values, this.props.explorationState.info.values) === false) {
            console.log("should reload data")
            this.props.dispatchDataReload(this.props.explorationState.info)
        }
    }

    onBottomBarButtonPress = (mode: ExplorationMode) => {
        switch (mode) {
            case ExplorationMode.Browse:
                this.props.dispatchCommand(createGoToBrowseOverviewAction(InteractionType.TouchOnly))
                break;
        }
    }

    undo = () => {
        this.props.dispatchCommand(createRestorePreviousInfoAction())
    }

    render() {

        return <View style={StyleTemplates.screenDefaultStyle}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBackground} />
            <View style={styles.headerContainerStyle}>
                {
                    generateHeaderView(this.props)
                }
            </View>
            <View style={styles.mainContainerStyle}>
                {/* main data panel ===================================================================*/}

                {
                    this.props.explorationDataState.info != null ?
                        this.makeMainPanel(this.props.explorationDataState.info.type) : <></>
                }

                {/* history panel ===================================================================*/}
                {this.props.explorationState.prevInfo != null && <View style={styles.historyPanelStyle}>
                    <Button
                        containerStyle={styles.historyButtonContainerStyle}
                        buttonStyle={styles.historyButtonStyle}
                        icon={undoIconStyle} onPress={this.undo}
                        title="Cancel latest"
                        titleStyle={styles.historyButtonTitleStyle}
                        />
                    </View>
                }
            </View>

            <BottomBar mode={explorationInfoHelper.getMode(this.props.explorationState.info)}
                onModePress={this.onBottomBarButtonPress}
            />

        </View>
    }

    makeMainPanel(type: ExplorationType): any {
        switch (type) {
            case ExplorationType.B_Ovrvw:
                return <OverviewMainPanel />
            case ExplorationType.B_Range:
                return <BrowseRangeMainPanel />
        }
    }
}



function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        dispatchCommand: (command: ExplorationAction) => dispatch(command),
        dispatchDataReload: (info: ExplorationInfo) => dispatch(startLoadingForInfo(info)),
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        explorationState: appState.explorationState,
        explorationDataState: appState.explorationDataState,
        selectedServiceKey: appState.settingsState.serviceKey
    }
}

const explorationScreen = connect(mapStateToProps, mapDispatchToProps)(ExplorationScreen)
export { explorationScreen as ExplorationScreen }