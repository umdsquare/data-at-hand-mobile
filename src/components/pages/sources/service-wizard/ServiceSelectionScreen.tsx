import React from "react";
import { View, Button, Text, ImageBackground, ScrollView, SafeAreaView } from "react-native";
import { MeasureSpec } from "../../../../measure/MeasureSpec";
import { PropsWithNavigation } from "../../../../PropsWithNavigation";
import { Sizes } from "../../../../style/Sizes";
import { StyleTemplates } from "../../../../style/Styles";
import { createStackNavigator } from "react-navigation-stack";
import { DataSource, DataSourceMeasure } from "../../../../measure/source/DataSource";
import { sourceManager, SourceSelectionInfo } from "../../../../system/SourceManager";
import { TouchableOpacity } from "react-native-gesture-handler";
import Colors from "../../../../style/Colors";

interface Prop extends PropsWithNavigation {

}

interface State {
    measureSpec: MeasureSpec,
    selectionInfo: SourceSelectionInfo,
    services: ReadonlyArray<DataSource>
}

export interface ServiceSelectionScreenParameters {
    measureSpec: MeasureSpec
    onServiceSelected: (selectedServiceMeasure: DataSourceMeasure) => void
}

export class ServiceSelectionScreen extends React.Component<Prop, State>{

    constructor(props) {
        super(props)

        this.state = {
            measureSpec: this.props.navigation.getParam("measureSpec"),
            selectionInfo: null,
            services: []
        }
    }

    async componentDidMount() {
        const selectionInfo = await sourceManager.getSourceSelectionInfo(this.state.measureSpec)
        const supportedServices = await sourceManager.getServicesSupportedInThisSystem()
        this.setState({
            ...this.state,
            selectionInfo: selectionInfo,
            services: supportedServices
        })
    }

    render() {
        return (
            <SafeAreaView style={{
                flex: 1, flexDirection: 'column', alignItems: 'stretch', marginTop: 120,
            }}>
                <Text style={{
                    ...StyleTemplates.titleTextStyle as any,
                    fontSize: Sizes.BigFontSize,
                    marginBottom: 24,
                    marginLeft: Sizes.horizontalPadding,
                    marginRight: Sizes.horizontalPadding
                }}>Select a Source for {this.state.measureSpec.name}</Text>
                <ScrollView style={{ flex: 1 }}>
                    {
                        this.state.services
                            .filter(s => s.getMeasureOfSpec(this.state.measureSpec))
                            .map((service, index) => <ServiceElement
                                key={service.key}
                                index={index}
                                selectedAlready={
                                    this.state.selectionInfo &&
                                    this.state.selectionInfo.connectedMeasureCodes
                                        .indexOf(service.getMeasureOfSpec(this.state.measureSpec).code) != -1
                                }
                                source={service}
                                onClick={async () => {
                                    const serviceMeasure = service.getMeasureOfSpec(this.state.measureSpec)

                                    if (serviceMeasure.dependencies.length > 0) {
                                        let dependencyResult: boolean = await serviceMeasure.dependencies[0].tryResolve()
                                        for (let i = 0; i < serviceMeasure.dependencies.length; i++) {
                                            if (dependencyResult === true) {
                                                dependencyResult = await serviceMeasure.dependencies[i].tryResolve()
                                            } else {
                                                break;
                                            }
                                        }
                                        if (dependencyResult === true) {
                                            await sourceManager.selectSourceMeasure(serviceMeasure, false)
                                            this.props.navigation.dismiss()
                                            this.props.navigation.state.params.onServiceSelected(serviceMeasure)
                                        } else {

                                        }
                                    } else {
                                        await sourceManager.selectSourceMeasure(serviceMeasure, false)
                                        this.props.navigation.dismiss()
                                        this.props.navigation.state.params.onServiceSelected(serviceMeasure)
                                    }
                                }} />)
                    }
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const ServiceElement = (props: { onClick: () => void, source: DataSource, index: number, selectedAlready: boolean }) => {
    return <TouchableOpacity disabled={props.selectedAlready}
        style={{
            marginTop: props.index === 0 ? 0 : 24,
            marginRight: 20,
            marginLeft: 20,
        }} activeOpacity={0.3} onPress={() => { props.onClick() }}>
        <View>
            <ImageBackground
                style={{
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                    alignItems: 'center',
                    aspectRatio: 2.5 / 1,
                    opacity: props.selectedAlready === true ? 0.5 : 1
                }}
                imageStyle={{ borderRadius: 12 }}
                source={props.source.thumbnail}
            >
                <Text style={{
                    ...StyleTemplates.titleTextStyle as any,
                    fontSize: 36,
                    alignContent: 'center',
                    fontWeight: '600',
                    color: "white"
                }}>{props.source.name}</Text>
            </ImageBackground>
            {props.selectedAlready === true ?
                (<View
                    style={{ position: 'absolute', right: 12, top: 8, backgroundColor: Colors.accent, borderRadius: 12, padding: 4, paddingLeft: 8, paddingRight: 8 }}>
                    <Text style={{ fontSize: Sizes.descriptionFontSize, fontWeight: 'bold', color: 'white' }}>
                        Already Selected
                        </Text>
                </View>) : (<></>)}
        </View>
    </TouchableOpacity>
}

export const ServiceSelectionWizardStack = createStackNavigator(
    {
        ServiceSelection: {
            screen: ServiceSelectionScreen
        }
    }, {
    initialRouteName: "ServiceSelection",
    defaultNavigationOptions: (navigationProp) => ({
        headerTransparent: true,
        headerLeftContainerStyle: { paddingLeft: 12 },
        headerLeft: (
            <Button title="Cancel" onPress={() => navigationProp.navigation.dismiss()} />
        )
    })
}
)