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

interface Prop extends PropsWithNavigation {
    measureSpec: MeasureSpec
}

interface State {
    availableMeasures: Array<DataSourceMeasure>
    activatedMeasures: Array<DataSourceMeasure>
}

export class MeasureComponent extends React.Component<Prop, State>{

    constructor(props) {
        super(props)

        this.state = {
            availableMeasures: null,
            activatedMeasures: null,
        }
    }

    componentDidMount() {
        const serviceMeasures = sourceManager.installedServices
            .map(service => service.getMeasureOfSpec(this.props.measureSpec))
            .filter(s => s != null)

        this.setState({
            ...this.state,
            availableMeasures: serviceMeasures
        })
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
                        (this.state.activatedMeasures != null && this.state.activatedMeasures.length > 0) ? (
                            <View style={{ flexDirection: "row" }}>
                                {
                                    this.state.activatedMeasures.map(measure => <SourceBadge key={measure.spec.nameKey} measure={measure} />)
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
                                    icon={{ name: 'pluscircle', type: 'antdesign', color: Colors.link, size: 20}}
                                    title="Connect My Service"
                                    onPress={()=>{
                                        this.props.navigation.navigate('ServiceWizardModal', {
                                            measureSpec: this.props.measureSpec
                                        } as ServiceSelectionScreenParameters)
                                    }
                                    } />
                            )


                    ) : <Text style={{ color: Colors.colorWarnLight }}>No sources supported in this system.</Text>
                }

            </Card>)
    }
}


const SourceBadge = (props) => {
    return (
        <Badge value={props.measure.source.name} />
    )
}