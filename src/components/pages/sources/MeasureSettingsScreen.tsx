import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { ButtonGroup } from 'react-native-elements';
import { StyleTemplates } from "../../../style/Styles";
import Colors from "../../../style/Colors";
import { FlatList } from "react-native-gesture-handler";
import { measureService } from "../../../system/MeasureService";
import { MeasureComponent } from "./MeasureComponent";
import { sourceManager } from "../../../system/SourceManager";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { useActionSheet, ActionSheetProvider } from '@expo/react-native-action-sheet'
import LinearGradient from 'react-native-linear-gradient';

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

    constructor(props: Prop) {
        super(props);
        this.state = {
            selectedMode: Mode.Measure,
            isLoading: true
        }

        this.updateMode = this.updateMode.bind(this)
    }

    componentDidMount() {
        sourceManager.getServicesSupportedInThisSystem().then(services => {
            this.setState({
                ...this.state,
                isLoading: false
            })
        })
    }

    render() {
        return (<ActionSheetProvider>
            <LinearGradient 
                style={{ flex: 1, alignSelf: 'stretch' }} 
                colors={Colors.lightBackgroundGradient}>
                {
                    this.state.isLoading === true ? (
                        <Text>Loading...</Text>
                        ) :
                        (<FlatList style={{ flex: 1, alignSelf: 'stretch' }}
                            data={measureService.supportedMeasureSpecs}
                            keyExtractor={(item, index) => item.nameKey}
                            renderItem={
                                (({ item, index, separators }) => (
                                    <View style={{ marginBottom: index === measureService.supportedMeasureSpecs.length - 1 ? 12 : 0 }}>
                                        <MeasureComponent measureSpec={item} navigation={this.props.navigation} />
                                    </View>
                                ))
                            }
                        />)
                }</LinearGradient>
        </ActionSheetProvider>)
    }

    updateMode(modeIndex: Mode) {
        this.setState({
            ...this.state,
            selectedMode: modeIndex
        })
    }
}