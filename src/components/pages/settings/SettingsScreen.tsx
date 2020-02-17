import React from "react";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { View, Text, StyleSheet, StatusBar, TouchableHighlight, Alert } from "react-native";
import { MeasureUnitType } from "../../../measure/DataSourceSpec";
import { Dispatch } from "redux";
import { ReduxAppState } from "../../../state/types";
import { connect } from "react-redux";
import { setUnit } from '../../../state/settings/actions';
import { Sizes } from "../../../style/Sizes";
import { Icon } from "react-native-elements";
import Colors from "../../../style/Colors";
import { DataServiceManager } from "../../../system/DataServiceManager";
import { connectActionSheet } from '@expo/react-native-action-sheet'
import { SvgIcon, SvgIconType } from "../../common/svg/SvgIcon";

const styles = StyleSheet.create({
    rowContainerStyle: {
        flexDirection: "row",
        height: 60,
        alignItems: 'center',
        borderBottomColor: "#Bababa",
        borderBottomWidth: 1,
        paddingLeft: Sizes.horizontalPadding,

        paddingRight: Sizes.horizontalPadding / 2,
        backgroundColor: 'white'
    },
    rowTitleStyle: {
        fontSize: 18,
        flex: 1
    },

    rowValueStyle: {
        fontSize: 18,
        color: Colors.primary,
        fontWeight: '500'
    }
})

const SettingsRow = (props: { title: string, value?: string, showArrow?: boolean, onClick: () => void }) => {
    return <TouchableHighlight underlayColor="#00000050" onPress={() => { props.onClick() }}>
        <View style={styles.rowContainerStyle}><Text style={styles.rowTitleStyle}>{props.title}</Text>
            <Text style={styles.rowValueStyle}>{props.value}</Text>
            {(props.showArrow !== false) && <SvgIcon type={SvgIconType.ArrowRight} color='gray' />}
        </View>

    </TouchableHighlight>
}


interface Props extends PropsWithNavigation {
    selectedUnitType: MeasureUnitType,
    setUnitType: (index) => void,
    selectedServiceKey: string,
    showActionSheetWithOptions
}

interface State {
    isLoading: boolean
}


class SettingsScreen extends React.PureComponent<Props, State>{


    static UnitTypes = [{
        key: MeasureUnitType.Metric,
        label: 'Metric'
    }, {
        key: MeasureUnitType.US,
        label: "US Standard"
    }]


    onPressUnitRow = () => {
        const selections = SettingsScreen.UnitTypes.map(t => t.label)
        selections.push("Cancel")
        this.props.showActionSheetWithOptions({
            options: selections,
            cancelButtonIndex: selections.length - 1,

        }, buttonIndex => {
            if (buttonIndex != selections.length - 1) {
                this.props.setUnitType(buttonIndex)
            }
        })
    }
    onPressServiceButton = () => { this.props.navigation.navigate("ServiceWizardModal") }

    onPressRefreshAllCache = () => {
        Alert.alert("Refresh all cache", "Clear all cache and reload data?", [
            {
                text: "Refresh all",
                style: 'destructive',
                onPress: async () => {
                    const services = await DataServiceManager.instance.getServicesSupportedInThisSystem()
                    for (const service of services) {
                        await service.clearAllCache()
                    }
                    await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).activateInSystem((progressInfo) => { })
                }
            },
            {
                text: "Cancel",
                style: 'cancel'
            }
        ], {
            cancelable: true
        })
    }

    onPressExportAllData = async () => {
        await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).exportData()
    }

    render() {
        return <View>
            <SettingsRow title="Service" value={DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).name}
                onClick={this.onPressServiceButton} />
            <SettingsRow title="Unit" value={SettingsScreen.UnitTypes.find(t => t.key === this.props.selectedUnitType).label}
                onClick={this.onPressUnitRow} />
            <SettingsRow title="Refresh all cache" onClick={this.onPressRefreshAllCache} showArrow={false} />
            <SettingsRow title={"Export " + DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).name + " data"} onClick={this.onPressExportAllData} showArrow={false} />
        </View>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        setUnitType: (index) => dispatch(setUnit(SettingsScreen.UnitTypes[index].key)),
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        selectedUnitType: appState.settingsState.unit,
        selectedServiceKey: appState.settingsState.serviceKey
    }
}


const settingsScreen = connectActionSheet(connect(mapStateToProps, mapDispatchToProps)(SettingsScreen))
export { settingsScreen as SettingsScreen }