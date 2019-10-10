import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { ButtonGroup } from 'react-native-elements';
import { StyleTemplates } from "../../../style/Styles";
import Colors from "../../../style/Colors";
import { FlatList } from "react-native-gesture-handler";
import { measureService } from "../../../system/MeasureService";
import { MeasureComponent } from "./MeasureComponent";
import { sourceManager } from "../../../system/SourceManager";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { useActionSheet, ActionSheetProvider } from '@expo/react-native-action-sheet'

enum Mode {
    Measure = 0,
    Source = 1,
}

interface Prop extends PropsWithNavigation {
}

interface State {
    selectedMode: Mode
    isLoading: boolean
}

export class MeasureSettingsScreen extends React.Component<Prop, State>{

    private buttons = ["View by Measure", "View by Source"]

    private styles = StyleSheet.create({
        upperContainer: {
            ...StyleTemplates.styleWithVerticalPadding,
            ...StyleTemplates.styleWithHorizontalPadding,
            alignItems: 'center', justifyContent: 'center'
        }
    })

    constructor(props: Prop) {
        super(props);
        this.state = {
            selectedMode: Mode.Measure,
            isLoading: true
        }

        this.updateMode = this.updateMode.bind(this)
    }

    componentDidMount() {
        Promise.all(sourceManager.installedServices.map(service => service.checkSupportedInSystem())).then(
            result => {
                this.setState({
                    ...this.state,
                    isLoading: false
                })
            }
        )
    }

    render() {
        return (<ActionSheetProvider>{
        this.state.isLoading === true? (<View style={{ flex: 1, flexDirection: 'column' }}>
                    <Text>Loading...</Text>
                </View>):(<FlatList style={{ flex: 1, alignSelf: 'stretch', backgroundColor: Colors.lightBackground }}
            data={measureService.supportedMeasureSpecs}
            keyExtractor={(item, index) => item.nameKey}
            renderItem={
                (({ item, index, separators }) => (
                    <MeasureComponent measureSpec={item} navigation={this.props.navigation} />
                ))
            }
        />)
        }
        </ActionSheetProvider>)
    }

    updateMode(modeIndex: Mode) {
        this.setState({
            ...this.state,
            selectedMode: modeIndex
        })
    }
}