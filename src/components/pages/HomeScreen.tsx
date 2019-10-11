import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import SVG, { G, Circle, Rect } from 'react-native-svg';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';
import { StyleTemplates } from '../../style/Styles';
import { Subscription } from 'rxjs';
import { sourceManager } from '../../system/SourceManager';

export class HomeScreen extends React.Component {

    static navigationOptions = ({ navigation }) => ({
        title: "Data@Hand",
        titleStyle: {
            alignSelf: "flex-start"
        },
        headerRight: (<Button type="clear" titleStyle={{ color: Colors.accent, marginRight: 12, fontSize: 16, fontWeight: '500' }} title="Measures" onPress={() => {
            navigation.navigate("MeasureSettings")
        }} />)
    })

    private readonly _subscriptions = new Subscription()

    componentDidMount(){
        this._subscriptions.add(
            sourceManager.onSelectedSourceChanged.subscribe(()=>{
                console.log("changed")
            })
        )
    }

    componentWillUnmount(){
        this._subscriptions.unsubscribe()
    }

    render() {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

                <View style={{ flexDirection: 'row', backgroundColor: 'red', height: 50}}>
                    <Text style={StyleTemplates.titleTextStyle}>Data@Hand</Text>
                </View>
            </View>
        );
    }
}
