import React from "react";
import { View, Text } from "react-native";
import { MeasureSpec } from "../../../measure/MeasureSpec";
import { Card, Button } from "react-native-elements";
import { StyleTemplates } from "../../../style/Styles";
import { sourceManager } from "../../../system/SourceManager";
import { DataSourceMeasure } from "../../../measure/source/DataSource";
import Colors from "../../../style/Colors";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { ServiceSelectionScreenParameters } from "./service-wizard/ServiceSelectionScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { connectActionSheet } from "@expo/react-native-action-sheet";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { AppState } from "../../../state/types";
import { getSourceSelectionInfo } from "../../../state/measure-settings/reducer";
import { selectSourceForMeasure, deselectSourceForMeasure } from "../../../state/measure-settings/actions";

interface Prop extends PropsWithNavigation {
    measureSpec: MeasureSpec
    connectedMeasures: Array<DataSourceMeasure>
    mainMeasureIndex: number
    selectMeasure: () => void,
    deselectMeasure: () => void
}

interface State {
    availableMeasures: Array<DataSourceMeasure>
}

const badgeSpacing = 8
const badgeTextStyle = {
    fontSize: 16, fontWeight: 'bold'
} as any

class MeasureComponent extends React.Component<Prop, State>{

    showActionSheetWithOptions

    constructor(props) {
        super(props)

        this.state = {
            availableMeasures: null
        }

        this.callNewServiceSelectionDialog.bind(this)
    }

    async componentDidMount() {
        const serviceMeasures = (await sourceManager.getServicesSupportedInThisSystem())
            .map(service => service.getMeasureOfSpec(this.props.measureSpec))
            .filter(s => s != null)

        const newState = {
            ...this.state,
            availableMeasures: serviceMeasures
        }
        this.setState(newState)

    }

    private callNewServiceSelectionDialog() {
        this.props.navigation.navigate('ServiceWizardModal', {
            measureSpec: this.props.measureSpec,
            selectedMeasureCodes: (this.props.connectedMeasures || []).map(m => m.code)
        } as ServiceSelectionScreenParameters)
    }

    render = () => {

        return (
            <Card
                containerStyle={StyleTemplates.backgroundCardStyle}
            >
                <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        marginRight: 8, width: 10, height: 10, borderRadius: 5,
                        backgroundColor: this.props.connectedMeasures && this.props.connectedMeasures.length > 0 ? Colors.green : 'lightgray' }} />
                    <Text style={{
                        ...StyleTemplates.titleTextStyle as any,
                    }
                    }>{this.props.measureSpec.name}</Text>
                </View>

                <Text style={{
                    ...StyleTemplates.descriptionTextStyle as any,
                    marginBottom: 12
                }}>{this.props.measureSpec.description}</Text>
                {
                    (this.state.availableMeasures != null && this.state.availableMeasures.length > 0) ? (
                        (this.props.connectedMeasures != null && this.props.connectedMeasures.length > 0) ? (
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {
                                    this.props.connectedMeasures.map((measure, index) => <SourceBadge
                                        style={{ marginLeft: index === 0 ? 0 : badgeSpacing }}
                                        key={measure.code}
                                        measure={measure}
                                        showActionSheetWithOptions={(this.props as any).showActionSheetWithOptions}
                                        isMain={this.props.connectedMeasures.indexOf(measure) === this.props.mainMeasureIndex} />)
                                }
                                {this.state.availableMeasures.length === this.props.connectedMeasures.length ?
                                    (<></>) : (<AddNewBadge onPress={() => {
                                        this.callNewServiceSelectionDialog()
                                    }} />)}
                            </View>
                        ) : (
                                <Button
                                    type="clear"
                                    titleStyle={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: Colors.link,
                                        marginLeft: 3,
                                        paddingBottom: 3
                                    }}
                                    icon={{ name: 'pluscircle', type: 'antdesign', color: Colors.link, size: 18 }}
                                    title="Connect My Service"
                                    onPress={() => {
                                        this.callNewServiceSelectionDialog()
                                    }
                                    } />
                            )


                    ) : <Text style={{ color: Colors.colorWarnLight }}>No sources supported in this system.</Text>
                }

            </Card>)
    }
}

const connectedMeasureComponent = connect(mapStateToProps)(connectActionSheet(MeasureComponent))

function mapStateToProps(appState: AppState, ownProps: Prop): Prop{
    const { measureSettingsState } = appState
    const selectionInfo = getSourceSelectionInfo(ownProps.measureSpec, measureSettingsState)
    if (selectionInfo) {
        return {
            ...ownProps,
            connectedMeasures: selectionInfo.connectedMeasureCodes.map(code => sourceManager.findMeasureByCode(code)),
            mainMeasureIndex: selectionInfo.mainIndex
        }
    } else return {
        ...ownProps,
        connectedMeasures: null,
        mainMeasureIndex: -1
    }
}

export { connectedMeasureComponent as MeasureComponent }


const badgeBaseStyle = {
    borderRadius: 6, flexDirection: "row", alignItems: "center",
    padding: 4, paddingLeft: 8, paddingRight: 8
} as any

interface SourceBadgeProps {
    style?: any,
    measure: DataSourceMeasure,
    isMain: boolean,
    showActionSheetWithOptions,
    setMeasureAsMain: ()=>void,
    deselectMeasure: ()=>void
}

function mapDispatchToPropsSourceBadge(dispatch: Dispatch, ownProps: SourceBadgeProps): SourceBadgeProps{
    return {
        setMeasureAsMain: () => dispatch(selectSourceForMeasure(ownProps.measure, true)),
        deselectMeasure: () => dispatch(deselectSourceForMeasure(ownProps.measure)),
        ...ownProps
    }
}

const SourceBadge = connect(null, mapDispatchToPropsSourceBadge)((props: SourceBadgeProps) => {
    return (
        <TouchableOpacity activeOpacity={0.7} style={props.style} onPress={() => {
            const options = ['Set as Default', 'Exclude this service', 'Cancel'];
            let setAsDefaultIndex = 0;
            let destructiveButtonIndex = 1;
            let cancelButtonIndex = 2;

            if (props.isMain === true) {
                setAsDefaultIndex = -1;
                options.splice(0, 1)
                destructiveButtonIndex = 0;
                cancelButtonIndex = 1;
            }

            props.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                },
                async (buttonIndex) => {
                    switch (buttonIndex) {
                        case destructiveButtonIndex:
                            const deactivatedResult = await props.measure.deactivatedInSystem()
                            if(deactivatedResult == true){
                                props.deselectMeasure()
                            }
                            break;
                        case setAsDefaultIndex:
                            props.setMeasureAsMain()
                            break;
                    }
                },
            );
        }}>
            <View style={{ ...badgeBaseStyle, backgroundColor: Colors.accent, paddingRight: props.isMain === true ? 4 : 8 }}>
                <Text style={{ ...badgeTextStyle as any, color: 'white' }}>{props.measure.source.name}</Text>
                {
                    props.isMain === true ? (<Icon name='star' color="yellow" size={16} style={{ paddingLeft: 4 }} />) : (<></>)
                }
            </View>
        </TouchableOpacity>
    )
})

interface AddNewBadgeProps {
    onPress: () => void
}

const AddNewBadge = (props: AddNewBadgeProps) => {
    return (<TouchableOpacity activeOpacity={0.7} onPress={() => {
        props.onPress()
    }}>
        <View style={{ ...badgeBaseStyle }}>
            <Icon name='add' color={Colors.link} size={18} style={{ paddingLeft: 4 }} />
            <Text style={{ ...badgeTextStyle as any, fontSize: 14, color: Colors.link }}>Add New</Text>
        </View>
    </TouchableOpacity>
    )
}