import React from "react";
import { View, Text, ImageBackground, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { PropsWithNavigation } from "../../../../PropsWithNavigation";
import { Sizes } from "../../../../style/Sizes";
import { StyleTemplates } from "../../../../style/Styles";
import { DataService } from "../../../../measure/service/DataService";
import { DataServiceManager } from "../../../../system/DataServiceManager";
import Colors from "../../../../style/Colors";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { ReduxAppState } from "../../../../state/types";
import { setService } from "../../../../state/settings/actions";

interface Prop extends PropsWithNavigation {
    selectService: (key: string, initialDate: number) => void,
    selectedServiceKey: string,
}

interface State {
    services: ReadonlyArray<DataService>
}

class ServiceSelectionScreen extends React.Component<Prop, State>{

    constructor(props) {
        super(props)

        this.state = {
            services: []
        }
    }

    async componentDidMount() {
        const supportedServices = await DataServiceManager.getServicesSupportedInThisSystem()
        this.setState({
            ...this.state,
            services: supportedServices
        })
    }


    render() {
        return (
            <SafeAreaView style={{
                flex: 1, flexDirection: 'column', alignItems: 'stretch'
            }}>
                <ScrollView style={{ flex: 1 }}>
                    {
                        this.state.services
                            .map((service, index) => <ServiceElement
                                key={service.key}
                                index={index}
                                selectedAlready={
                                    this.props.selectedServiceKey === service.key
                                }
                                source={service}
                                onSelected={
                                    () => {
                                        if (this.props.selectedServiceKey != service.key) {
                                            DataServiceManager.getServiceByKey(service.key).activateInSystem((progressInfo)=>{})
                                                .then(result => {
                                                    if (result.success === true) {
                                                        return DataServiceManager.getServiceByKey(this.props.selectedServiceKey)
                                                            .deactivatedInSystem().then(deactivated => {
                                                                this.props.selectService(service.key, result.serviceInitialDate)
                                                                this.props.navigation.goBack()
                                                            }).catch(err => {
                                                                this.props.selectService(service.key, result.serviceInitialDate)
                                                                this.props.navigation.goBack()
                                                            })
                                                    }
                                                }).catch(err => {
                                                    console.error("Failed to sign in to ", service.key, err)
                                                })
                                        }
                                    }
                                } />)
                    }
                </ScrollView>
            </SafeAreaView>
        );
    }
}

function mapStateToPropsScreen(appState: ReduxAppState, ownProps: Prop): Prop {
    return {
        ...ownProps,
        selectedServiceKey: appState.settingsState.serviceKey
    }
}

function mapDispatchToPropsScreen(dispatch: Dispatch, ownProps: Prop): Prop {
    return {
        ...ownProps,
        selectService: (key: string, initialDate: number) => dispatch(setService(key, initialDate))
    }
}

const connectedServiceSelectionScreen = connect(mapStateToPropsScreen, mapDispatchToPropsScreen)(ServiceSelectionScreen)
export { connectedServiceSelectionScreen as ServiceSelectionScreen }


interface ServiceElementProps {
    source: DataService,
    index: number,
    selectedAlready: boolean,
    onSelected(): void,

}

const ServiceElement = (props: ServiceElementProps) => {
    return <TouchableOpacity disabled={props.selectedAlready}
        style={{
            marginTop: 24,
            marginRight: 20,
            marginLeft: 20,
        }} activeOpacity={0.3} onPress={async () => {
            props.onSelected()
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
}