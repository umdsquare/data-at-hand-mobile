import React from "react";
import { View, Text, ImageBackground, ScrollView, SafeAreaView, Platform } from "react-native";
import { MeasureSpec } from "../../../../measure/MeasureSpec";
import { PropsWithNavigation } from "../../../../PropsWithNavigation";
import { Sizes } from "../../../../style/Sizes";
import { StyleTemplates } from "../../../../style/Styles";
import { createStackNavigator } from "react-navigation-stack";
import { DataSource, DataSourceMeasure } from "../../../../measure/source/DataSource";
import { sourceManager, SourceSelectionInfo } from "../../../../system/SourceManager";
import { TouchableOpacity } from "react-native-gesture-handler";
import Colors from "../../../../style/Colors";
import { Button } from "react-native-elements";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { selectSourceForMeasure } from "../../../../state/measure-settings/actions";

interface Prop extends PropsWithNavigation {
    selectSource: () => void,
}

interface State {
    measureSpec: MeasureSpec,
    selectedMeasureCodes: Array<string>,
    services: ReadonlyArray<DataSource>
}

export interface ServiceSelectionScreenParameters {
    measureSpec: MeasureSpec,
    selectedMeasureCodes: Array<string>,
}

export class ServiceSelectionScreen extends React.Component<Prop, State>{

    constructor(props) {
        super(props)

        this.state = {
            measureSpec: this.props.navigation.getParam("measureSpec"),
            selectedMeasureCodes: this.props.navigation.getParam("selectedMeasureCodes"),
            services: []
        }
    }

    async componentDidMount() {
        const supportedServices = await sourceManager.getServicesSupportedInThisSystem()
        this.setState({
            ...this.state,
            services: supportedServices
        })
    }

    render() {
        return (
            <SafeAreaView style={{
                flex: 1, flexDirection: 'column', alignItems: 'stretch', marginTop: Sizes.navHeaderSize + Sizes.verticalPadding,
            }}>
                <Text style={{
                    ...StyleTemplates.titleTextStyle as any,
                    fontSize: Sizes.titleFontSize,
                    marginBottom: 24,
                    marginLeft: Sizes.horizontalPadding,
                    marginRight: Sizes.horizontalPadding,
                    textAlign: 'center'
                }}>Select a Source for {this.state.measureSpec.name}</Text>
                <ScrollView style={{ flex: 1 }}>
                    {
                        this.state.services
                            .filter(s => s.getMeasureOfSpec(this.state.measureSpec))
                            .map((service, index) => <ServiceElement
                                key={service.key}
                                index={index}
                                selectedAlready={
                                    this.state.selectedMeasureCodes &&
                                    this.state.selectedMeasureCodes
                                        .indexOf(service.getMeasureOfSpec(this.state.measureSpec).code) != -1
                                }
                                source={service}
                                measureSpec={this.state.measureSpec}
                                onSelected={this.props.navigation.dismiss} />)
                    }
                </ScrollView>
            </SafeAreaView>
        );
    }
}

interface ServiceElementProps {
    measureSpec: MeasureSpec,
    source: DataSource,
    index: number,
    selectedAlready: boolean,
    select(): void,
    onSelected(): void
}

function mapStateToProps(ownProps: ServiceElementProps): ServiceElementProps {
    return ownProps
}

function mapDispatchToPropsForServiceElement(dispatch: Dispatch, ownProps: ServiceElementProps) {
    return {
        ...ownProps,
        select: () => {
            dispatch(selectSourceForMeasure(ownProps.source.getMeasureOfSpec(ownProps.measureSpec), false))
        }
    }
}

const ServiceElement = connect(mapStateToProps, mapDispatchToPropsForServiceElement)((props: ServiceElementProps) => {
    return <TouchableOpacity disabled={props.selectedAlready}
        style={{
            marginTop: props.index === 0 ? 0 : 24,
            marginRight: 20,
            marginLeft: 20,
        }} activeOpacity={0.3} onPress={async () => {
            const serviceMeasure = props.source.getMeasureOfSpec(props.measureSpec)
            const activated = await serviceMeasure.activateInSystem()
            if (activated === true) {
                props.select()
                props.onSelected()
            }
        }}>
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
})

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
            <Button title="Cancel" type="clear" onPress={() => navigationProp.navigation.dismiss()} />
        )
    })
}
)