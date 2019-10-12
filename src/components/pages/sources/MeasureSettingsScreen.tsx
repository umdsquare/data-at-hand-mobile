import React from "react";
import { View, Text } from "react-native";
import Colors from "../../../style/Colors";
import { FlatList } from "react-native-gesture-handler";
import { measureService } from "../../../system/MeasureService";
import { MeasureComponent } from "./MeasureComponent";
import { sourceManager } from "../../../system/SourceManager";
import { PropsWithNavigation } from "../../../PropsWithNavigation";
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import LinearGradient from 'react-native-linear-gradient';

interface Prop extends PropsWithNavigation {
}

interface State {
    isLoading: boolean
}

export class MeasureSettingsScreen extends React.Component<Prop, State>{

    constructor(props: Prop) {
        super(props);
        this.state = {
            isLoading: true
        }
    }

    componentDidMount() {
        sourceManager.getServicesSupportedInThisSystem().then(() => {
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
                            keyExtractor={(item) => item.nameKey}
                            renderItem={
                                (({ item, index }) => (
                                    <View style={{ marginBottom: index === measureService.supportedMeasureSpecs.length - 1 ? 12 : 0 }}>
                                        <MeasureComponent measureSpec={item} navigation={this.props.navigation} />
                                    </View>
                                ))
                            }
                        />)
                }</LinearGradient>
        </ActionSheetProvider>)
    }
}