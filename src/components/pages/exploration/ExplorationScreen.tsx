import { PropsWithNavigation } from "../../../PropsWithNavigation";
import React from "react";
import { StatusBar, View, StyleSheet, Text, Platform, SafeAreaView } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
import { ExplorationState, resolveExplorationCommand } from "../../../state/exploration/reducers";
import { Dispatch } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { ReduxAppState } from "../../../state/types";
import { connect } from "react-redux";
import { generateHeaderView } from "./parts/header";
import { ExplorationCommand } from "../../../core/interaction/commands";
import { BottomBar } from "../../exploration/BottomBar";
import { explorationCommandResolver } from "../../../core/interaction/ExplorationCommandResolver";

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
    dispatchCommand: (command: ExplorationCommand)=>void
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

    render() {
        return <View style={StyleTemplates.screenDefaultStyle}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBackground} />
            <View style={styles.headerContainerStyle}>
                {
                    generateHeaderView(this.props)
                }
            </View>
            <View style={styles.mainContainerStyle}>

            </View>

            <BottomBar mode={explorationCommandResolver.getMode(this.props.explorationState.info)}/>

        </View>
    }
}



function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        dispatchCommand: (command: ExplorationCommand) => dispatch(resolveExplorationCommand(command)),
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: ExplorationProps): ExplorationProps {
    return {
        ...ownProps,
        explorationState: appState.explorationState
    }
}

const explorationScreen = connect(mapStateToProps, mapDispatchToProps)(ExplorationScreen)
export {explorationScreen as ExplorationScreen}