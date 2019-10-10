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
    }

    async componentDidMount() {
        const serviceMeasures = sourceManager.installedServices
            .map(service => service.getMeasureOfSpec(this.props.measureSpec))
            .filter(s => s != null)

        const newState = {
            ...this.state,
            availableMeasures: serviceMeasures
        }

        await this.refreshInformation(serviceMeasures, newState)
    }

    async refreshInformation(serviceMeasures: Array<DataSourceMeasure>, newState: State = {...this.state}){
        if (serviceMeasures.length > 0) {
            const selectionInfo = await sourceManager.getSourceSelectionInfo(this.props.measureSpec)
            if (selectionInfo) {
                newState.connectedMeasures = selectionInfo.connectedMeasureCodes.map(code => sourceManager.findMeasureByCode(code))
                newState.mainMeasureIndex = selectionInfo.mainIndex
            }else{
                newState.connectedMeasures = null
                newState.mainMeasureIndex = -1
            }
        }

        this.setState(newState)
    }

    render = () => {

        return (
            <Card
                containerStyle={StyleTemplates.backgroundCardStyle}
            >
                <Text style={{
                    ...StyleTemplates.titleTextStyle as any,
                    marginBottom: 4
                }
                }>{this.props.measureSpec.name}</Text>
                <Text style={{
                    ...StyleTemplates.descriptionTextStyle as any,
                    marginBottom: 12
                }}>{this.props.measureSpec.description}</Text>
                {
                    (this.state.availableMeasures != null && this.state.availableMeasures.length > 0) ? (
                        (this.state.connectedMeasures != null && this.state.connectedMeasures.length > 0) ? (
                            <View style={{ flexDirection: "row" }}>
                                {
                                    this.state.connectedMeasures.map(measure => <SourceBadge
                                        key={measure.spec.nameKey}
                                        measure={measure}
                                        refreshFunc = {()=>this.refreshInformation(this.state.availableMeasures)}
                                        showActionSheetWithOptions={(this.props as any).showActionSheetWithOptions}
                                        isMain={this.state.connectedMeasures.indexOf(measure) === this.state.mainMeasureIndex} />)
                                }
                            </View>
                        ) : (
                                <Button
                                    type="clear"
                                    titleStyle={{
                                        fontSize: Sizes.subtitleFontSize,
                                        fontWeight: 'bold',
                                        color: Colors.link,
                                        marginLeft: 3,
                                        paddingBottom: 3
                                    }}
                                    icon={{ name: 'pluscircle', type: 'antdesign', color: Colors.link, size: 20 }}
                                    title="Connect My Service"
                                    onPress={() => {
                                        this.props.navigation.navigate('ServiceWizardModal', {
                                            measureSpec: this.props.measureSpec,
                                            onServiceSelected: async (selectedSourceMeasure: DataSourceMeasure) => {
                                                await this.refreshInformation(this.state.availableMeasures)
                                            }
                                        } as ServiceSelectionScreenParameters)
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

interface SourceBadgeProps {
    measure: DataSourceMeasure,
    isMain: boolean,
    showActionSheetWithOptions,
    refreshFunc: Function
}

const SourceBadge = (props: SourceBadgeProps) => {
    return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => {
            const options = ['Set as Default', 'Exclude this service', 'Cancel'];
            let setAsDefaultIndex = 0;
            let destructiveButtonIndex = 1;
            let cancelButtonIndex = 2;
            
            if(props.isMain===true){
                setAsDefaultIndex = -1;
                options.splice(0,1)
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
                    if(buttonIndex === destructiveButtonIndex){
                        //remove this measure service
                        await sourceManager.deselectSourceMeasure(props.measure)
                        await props.refreshFunc()
                    }
                },
              );
        }}>
            <View style={{ borderRadius: 6, flexDirection: "row", alignItems: "center", backgroundColor: Colors.accent, padding: 4, paddingLeft: 8, paddingRight: props.isMain === true ? 4 : 8 }}>
                <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>{props.measure.source.name}</Text>
                {
                    props.isMain === true ? (<Icon name='star' color="yellow" size={16} style={{ paddingLeft: 4 }} />) : (<></>)
                }
            </View></TouchableOpacity>
    )
}