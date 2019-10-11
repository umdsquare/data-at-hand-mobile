import React from "react";
import { View, Text } from "react-native";
import { MeasureSpec } from "../../../measure/MeasureSpec";
import { Card, Badge, Button } from "react-native-elements";
import { tsNonNullExpression } from "@babel/types";
import { StyleTemplates } from "../../../style/Styles";
import { Sizes } from "../../../style/Sizes";
import { sourceManager } from "../../../system/SourceManager";
import { DataSourceMeasure, DataSource } from "../../../measure/source/DataSource";
import Colors from "../../../style/Colors";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { ServiceSelectionScreenParameters } from "./service-wizard/ServiceSelectionScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useActionSheet, connectActionSheet } from "@expo/react-native-action-sheet";

interface Prop extends PropsWithNavigation {
    measureSpec: MeasureSpec
}

interface State {
    availableMeasures: Array<DataSourceMeasure>
    connectedMeasures: Array<DataSourceMeasure>
    mainMeasureIndex: number
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
            availableMeasures: null,
            connectedMeasures: null,
            mainMeasureIndex: 0
        }

        this.refreshInformation.bind(this)
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

        await this.refreshInformation(serviceMeasures, newState)
    }

    async refreshInformation(serviceMeasures: Array<DataSourceMeasure>, newState: State = { ...this.state }) {
        if (serviceMeasures.length > 0) {
            const selectionInfo = await sourceManager.getSourceSelectionInfo(this.props.measureSpec)
            if (selectionInfo) {
                newState.connectedMeasures = selectionInfo.connectedMeasureCodes.map(code => sourceManager.findMeasureByCode(code))
                newState.mainMeasureIndex = selectionInfo.mainIndex
            } else {
                newState.connectedMeasures = null
                newState.mainMeasureIndex = -1
            }
        }

        this.setState(newState)
    }

    private callNewServiceSelectionDialog() {
        this.props.navigation.navigate('ServiceWizardModal', {
            measureSpec: this.props.measureSpec,
            onServiceSelected: async (selectedSourceMeasure: DataSourceMeasure) => {
                await this.refreshInformation(this.state.availableMeasures)
            }
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
                        backgroundColor: this.state.connectedMeasures && this.state.connectedMeasures.length > 0 ? Colors.green : 'lightgray' }} />
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
                        (this.state.connectedMeasures != null && this.state.connectedMeasures.length > 0) ? (
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {
                                    this.state.connectedMeasures.map((measure, index) => <SourceBadge
                                        style={{ marginLeft: index === 0 ? 0 : badgeSpacing }}
                                        key={measure.code}
                                        measure={measure}
                                        refreshFunc={() => this.refreshInformation(this.state.availableMeasures)}
                                        showActionSheetWithOptions={(this.props as any).showActionSheetWithOptions}
                                        isMain={this.state.connectedMeasures.indexOf(measure) === this.state.mainMeasureIndex} />)
                                }
                                {this.state.availableMeasures.length === this.state.connectedMeasures.length ?
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

const connectedMeasureComponent = connectActionSheet(MeasureComponent)
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
    refreshFunc: Function
}

const SourceBadge = (props: SourceBadgeProps) => {
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
                            await sourceManager.deselectSourceMeasure(props.measure)
                            await props.refreshFunc()
                            break;
                        case setAsDefaultIndex:
                            await sourceManager.selectSourceMeasure(props.measure, true)
                            await props.refreshFunc()
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
}

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