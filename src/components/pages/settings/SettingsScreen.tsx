import React, { useCallback, useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableHighlight, Alert, ScrollView, Switch, ViewStyle, Platform, SafeAreaView, ActionSheetIOS, UIManager, findNodeHandle } from "react-native";
import { MeasureUnitType } from "@measure/DataSourceSpec";
import { Dispatch } from "redux";
import { ReduxAppState } from "@state/types";
import { connect } from "react-redux";
import { setUnit, setRecordLogs, setRecordScreens } from '@state/settings/actions';
import { Sizes } from "@style/Sizes";
import Colors from "@style/Colors";
import { DataServiceManager } from "@measure/DataServiceManager";
import { SvgIcon, SvgIconType } from "@components/common/svg/SvgIcon";
import { InitialLoadingIndicator } from "@components/pages/exploration/parts/main/InitialLoadingIndicator";
import { StackNavigationProp } from "@react-navigation/stack";
import { SettingsSteckParamList } from "@components/Routes";
import { SystemLogger } from "@core/logging/SystemLogger";
import { StyleTemplates } from "@style/Styles";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import { AboutPanel } from "./AbountPanel";
import { format } from "date-fns";


const unitTypes = [{
    key: MeasureUnitType.Metric,
    label: 'Metric'
}, {
    key: MeasureUnitType.US,
    label: "US Standard"
}]

const rowContainerStyle = {
    flexDirection: "row",
    height: 60,
    alignItems: 'center',
    borderBottomColor: "#Bababa",
    borderBottomWidth: 1,
    paddingLeft: Sizes.horizontalPadding,

    paddingRight: Sizes.horizontalPadding / 2,
    backgroundColor: 'white'
} as ViewStyle

const styles = StyleSheet.create({
    rowContainerStyleNormalPadding: {
        ...rowContainerStyle,
        paddingRight: Sizes.horizontalPadding
    },
    rowTitleStyle: {
        fontSize: 18,
        flex: 1
    },
    rowTitleStyleWithSubTitle: {
        fontSize: 18
    },

    rowSubTitleStyle: {
        fontSize: Sizes.smallFontSize,
        color: Colors.textGray,
        marginTop: 6
    },

    rowValueStyle: {
        fontSize: 18,
        color: Colors.primary,
        fontWeight: '500'
    },

    subheaderStyle: {
        paddingTop: Sizes.verticalPadding * 2,
        paddingBottom: Sizes.verticalPadding,
        fontSize: Sizes.normalFontSize,
        paddingLeft: Sizes.horizontalPadding,
        color: Colors.textGray,
        fontWeight: '500',
        backgroundColor: Colors.backPanelColor
    },

    smallTextStyle: { 
        color: Colors.textColorLight
     }
})

const SettingsRow = React.forwardRef((props: { title: string, subtitle?: string, value?: string, showArrow?: boolean, onClick: () => void }, ref: any) => {
    return <TouchableHighlight ref={ref} underlayColor="#00000050" onPress={() => { props.onClick() }}>
        <View style={rowContainerStyle}>
            {
                props.subtitle != null ? <View>
                    <Text style={styles.rowTitleStyleWithSubTitle}>{props.title}</Text>
                    <Text style={styles.rowSubTitleStyle}>{props.subtitle}</Text>
                </View> : <Text style={styles.rowTitleStyle}>{props.title}</Text>
            }
            <Text style={styles.rowValueStyle}>{props.value}</Text>
            {(props.showArrow !== false) && <SvgIcon type={SvgIconType.ArrowRight} color='gray' />}
        </View>
    </TouchableHighlight>
})

const BooleanSettingsRow = (props: { title: string, value: boolean, onChange?: (value: boolean) => void }) => {

    const onValueChange = useCallback((newValue: boolean) => {
        if (props.onChange) {
            props.onChange(newValue)
        }
    }, [props.onChange])

    return <View style={styles.rowContainerStyleNormalPadding}>
        <Text style={styles.rowTitleStyle}>{props.title}</Text>
        <Switch value={props.value || false} onValueChange={onValueChange}
            trackColor={{ false: undefined, true: Platform.OS === 'android' ? Colors.primaryLight : Colors.primary }}
            thumbColor={Platform.OS === 'android' ? (props.value === true ? Colors.primary : '#f0f0f0') : undefined}
        />
    </View>
}

const Subheader = React.memo((props: { title: string }) => {
    return <Text style={styles.subheaderStyle}>{props.title}</Text>
})


const ServiceQuotaMeter = React.memo((props: { serviceKey: string }) => {

    const [isLoading, setIsLoading] = useState(false)
    const [leftQuota, setLeftQuota] = useState(Number.MAX_SAFE_INTEGER)
    const [quotaResetAt, setQuotaResetAt] = useState(Number.NaN)

    const service = useMemo(() => DataServiceManager.instance.getServiceByKey(props.serviceKey), [props.serviceKey])

    const quotaLimited = useMemo(() => service.isQuotaLimited, [service])

    const reloadQuotaInfo = useCallback(async () => {
        if (quotaLimited === true) {
            setIsLoading(true)
            setLeftQuota(await service.getLeftQuota())
            setQuotaResetAt(await service.getQuotaResetEpoch())
            setIsLoading(false)
        }
    }, [quotaLimited, service])

    useEffect(() => {
        reloadQuotaInfo()
    }, [])

    if (quotaLimited === true) {
        return <View style={styles.rowContainerStyleNormalPadding}>
            <Text style={styles.rowTitleStyle}>Service Quota</Text>
            {
                quotaResetAt >= Date.now() ? <Text style={styles.smallTextStyle}>{leftQuota} Calls left (refilled at {format(quotaResetAt, "h:mm a")}).</Text>
                    : <Text style={styles.smallTextStyle}>Full quota left.</Text>
            }
        </View>
    } else return null
})


interface Props {
    navigation: StackNavigationProp<SettingsSteckParamList, "Main">,

    //redux
    selectedUnitType: MeasureUnitType,
    selectedServiceKey: string,
    recordLogs: boolean,
    recordScreens: boolean,
    loggingSessionId?: string,

    setUnitType: (index: number) => void,
    setRecordLogs: (record: boolean, id?: string) => void
    setRecordScreens: (record: boolean) => void
}

interface State {
    isLoading: boolean,
    loadingMessage?: string
}


class SettingsScreen extends React.PureComponent<Props, State>{

    private unitRowRef = React.createRef()

    constructor(props: Props) {
        super(props)

        this.state = {
            isLoading: false,
            loadingMessage: null
        }
    }

    readonly onPressUnitRow = () => {
        const selections = unitTypes.map(t => t.label)
        if (Platform.OS === 'ios') {
            selections.push("Cancel")
            ActionSheetIOS.showActionSheetWithOptions({
                options: selections,
                cancelButtonIndex: selections.length - 1,
            }, buttonIndex => {
                if (buttonIndex != selections.length - 1) {
                    this.props.setUnitType(buttonIndex)
                }
            })
        } else if (Platform.OS === 'android') {
            UIManager.showPopupMenu(findNodeHandle(this.unitRowRef.current as any), selections, () => { }, (item, buttonIndex) => {
                this.props.setUnitType(buttonIndex)
            })
        }
    }

    readonly onPressServiceButton = () => { this.props.navigation.navigate("ServiceWizardModal") }

    readonly onPressRefreshAllCache = () => {
        Alert.alert("Refresh all cache", "Clear all cache and reload data?", [
            {
                text: "Refresh all",
                style: 'destructive',
                onPress: async () => {
                    this.setState({
                        ...this.state,
                        isLoading: true,
                        loadingMessage: 'Refreshing...'
                    })
                    const services = await DataServiceManager.instance.getServicesSupportedInThisSystem()
                    for (const service of services) {
                        await service.clearAllCache()
                    }
                    await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).activateInSystem((progressInfo) => {
                        this.setState({
                            ...this.state,
                            loadingMessage: progressInfo.message
                        })
                    })

                    this.setState({
                        ...this.state,
                        isLoading: false,
                        loadingMessage: null
                    })
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

    readonly onPressExportAllData = async () => {
        await DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).exportData()
    }

    readonly onSetRecordLogs = (recordLogs: boolean) => {
        if (this.props.recordLogs === false && recordLogs === true && this.props.loggingSessionId != null) {
            //when the user is about to turn on
            Alert.alert("Start Logging", "Start a new session?", [
                {
                    text: "Start a new session",
                    style: 'destructive',
                    onPress: () => {
                        //start a new session
                        this.props.setRecordLogs(true, undefined)
                    }
                },
                {
                    text: "Continue this session",
                    style: 'default',
                    onPress: () => {
                        //continue this session
                        this.props.setRecordLogs(true, this.props.loggingSessionId)
                    }
                },
                {
                    text: "Cancel",
                    style: 'cancel'
                }
            ], {
                cancelable: true
            })
        } else this.props.setRecordLogs(recordLogs, this.props.loggingSessionId)
    }

    readonly onSetRecordScreens = (recordScreens: boolean) => {
        this.props.setRecordScreens(recordScreens)
    }

    readonly onClearLoggingSession = () => {
        Alert.alert("Clear Logging Session", "Remove the log data?", [
            {
                text: "Remove logs",
                style: 'destructive',
                onPress: async () => {
                    await this.removeLoggingData()
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

    private async removeLoggingData(): Promise<void> {
        this.setState({
            ...this.state,
            isLoading: true,
            loadingMessage: 'Removing log data...'
        })

        await SystemLogger.instance.clearLogsInCurrentSession()
        this.props.setRecordLogs(false, undefined)

        this.setState({
            ...this.state,
            isLoading: false,
            loadingMessage: null
        })
    }

    readonly onExportLogsClick = async () => {
        await SystemLogger.instance.exportLogs()
    }

    render() {
        return <View style={StyleTemplates.backPanelBackgroundColor}>
            <View style={{
                ...StyleTemplates.fitParent,
                top: undefined,
                height: '50%',
                backgroundColor: Colors.headerBackground
            }} />
            <SafeAreaConsumer>
                {insets =>
                    <ScrollView>
                        <Subheader title={"Measure Data Source"} />
                        <SettingsRow title="Service" value={DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).name}
                            onClick={this.onPressServiceButton} />
                        <ServiceQuotaMeter serviceKey={this.props.selectedServiceKey} />
                        <SettingsRow title="Refresh all data cache" onClick={this.onPressRefreshAllCache} showArrow={false} />
                        {
                            __DEV__ === true ?
                                <SettingsRow title={"Export " + DataServiceManager.instance.getServiceByKey(this.props.selectedServiceKey).name + " data"} onClick={this.onPressExportAllData} showArrow={false} />
                                : null
                        }
                        {
                            this.state.isLoading === true ? <InitialLoadingIndicator loadingMessage={this.state.loadingMessage} /> : null
                        }


                        <Subheader title={"Display Settings"} />
                        <SettingsRow ref={this.unitRowRef} title="Unit" value={unitTypes.find(t => t.key === this.props.selectedUnitType).label}
                            onClick={this.onPressUnitRow} />


                        <Subheader title={"Logging"} />

                        <BooleanSettingsRow title="Record Logs" value={this.props.recordLogs} onChange={this.onSetRecordLogs} />
                        {
                            this.props.recordLogs === true ?
                                <BooleanSettingsRow title="Record Screens" value={this.props.recordScreens} onChange={this.onSetRecordScreens} /> : null
                        }
                        {
                            this.props.loggingSessionId != null ? <>
                                <SettingsRow title="Clear the current logging session" subtitle={"Current session id: " + this.props.loggingSessionId}
                                    onClick={this.onClearLoggingSession} showArrow={false} />
                                <SettingsRow title="Export logs" onClick={this.onExportLogsClick} showArrow={false} />
                            </> : null
                        }


                        <Subheader title={"About"} />
                        <AboutPanel containerStyle={{
                            paddingBottom: Math.max(20, insets!.bottom) + 20
                        }} />
                    </ScrollView>
                }
            </SafeAreaConsumer>
        </View>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        setUnitType: (index) => dispatch(setUnit(unitTypes[index].key)),
        setRecordLogs: (record, id) => dispatch(setRecordLogs(record, id)),
        setRecordScreens: (record) => dispatch(setRecordScreens(record))
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        selectedUnitType: appState.settingsState.unit,
        selectedServiceKey: appState.settingsState.serviceKey,
        recordLogs: appState.settingsState.recordLogs,
        recordScreens: appState.settingsState.recordScreens,
        loggingSessionId: appState.settingsState.loggingSessionId
    }
}


const settingsScreen = connect(mapStateToProps, mapDispatchToProps)(SettingsScreen)
export { settingsScreen as SettingsScreen }