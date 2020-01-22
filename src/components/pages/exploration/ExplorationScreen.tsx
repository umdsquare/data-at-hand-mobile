import { PropsWithNavigation } from "../../../PropsWithNavigation";
import React, { Props } from "react";
import { StatusBar, View, StyleSheet, Text, Platform, SafeAreaView } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
import { ExplorationState, resolveExplorationCommand } from "../../../state/exploration/interaction/reducers";
import { Dispatch } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { ReduxAppState } from "../../../state/types";
import { connect } from "react-redux";
import { generateHeaderView } from "./parts/header";
import { ExplorationCommand } from "../../../core/exploration/commands";
import { BottomBar } from "../../exploration/BottomBar";
import { explorationCommandResolver } from "../../../core/exploration/ExplorationCommandResolver";
import { DataServiceManager } from "../../../system/DataServiceManager";
import { DataSourceType } from "../../../measure/DataSourceSpec";
import { ParameterType, ExplorationInfo } from "../../../core/exploration/types";
import { DataLevel } from "../../../database/types";
import { ExplorationDataState, startLoadingForInfo } from "../../../state/exploration/data/reducers";
import { ExplorationMainPanel } from "./parts/main";
var deepEqual = require('deep-equal');

const styles = StyleSheet.create({

    headerContainerStyle: {
        backgroundColor: Colors.headerBackground,
    },

    mainContainerStyle: {
        ...StyleTemplates.screenDefaultStyle,
        backgroundColor: "#EFEFF4",
        zIndex: Platform.OS === 'android' ? 100 : undefined,
    }
})

export interface ExplorationProps extends PropsWithNavigation {
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState,
    selectedServiceKey: string,
    dispatchCommand: (command: ExplorationCommand) => void,
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
            DataServiceManager.getServiceByKey(this.props.selectedServiceKey).activateInSystem().then(success => {
                console.log("activated ", this.props.selectedServiceKey, "successfully.")
                this.props.dispatchDataReload(this.props.explorationState.info)
            }).catch(error => {
                console.log("service activation error: ", this.props.selectedServiceKey, error)
            })
        }
    }

    async componentDidUpdate(prevProps: ExplorationProps) {
        if (this.props.explorationState.isProcessing === false && this.props.explorationState.error == null) {
            if (this.props.explorationState.info.type !== prevProps.explorationState.info.type || deepEqual(prevProps.explorationState.info.values, this.props.explorationState.info.values) === false) {
                console.log("should reload data")
                this.props.dispatchDataReload(this.props.explorationState.info)
            }
        }
    }

    /*
            if (this.props.selectedServiceKey === 'fitbit') {
    
                const range = explorationCommandResolver.getParameterValue(this.props.explorationState.info, ParameterType.Range)
                const data = await DataServiceManager.getServiceByKey('fitbit').fetchData(DataSourceType.HeartRate, DataLevel.DailyActivity, new Date(range[0]), new Date(range[1]))
                console.log(data)
            }*/

    render() {

        return <View style={StyleTemplates.screenDefaultStyle}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBackground} />
            <View style={styles.headerContainerStyle}>
                {
                    generateHeaderView(this.props)
                }
            </View>
            <View style={styles.mainContainerStyle}>
                <ExplorationMainPanel/>
            </View>

            <BottomBar mode={explorationCommandResolver.getMode(this.props.explorationState.info)} />

        </View>
    }
}



function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        dispatchCommand: (command: ExplorationCommand) => dispatch(resolveExplorationCommand(command)),
        dispatchDataReload: (info: ExplorationInfo) => dispatch(startLoadingForInfo(info))
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