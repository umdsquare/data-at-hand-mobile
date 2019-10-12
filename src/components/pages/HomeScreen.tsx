import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';
import { StyleTemplates } from '../../style/Styles';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationStackOptions } from 'react-navigation-stack';

export class HomeScreen extends React.Component {

    static navigationOptions = ({ navigation }) => ({
        title: "Data@Hand",
        titleStyle: {
            alignSelf: "flex-start"
        },
        headerRight: (<Button type="clear" titleStyle={{ color: Colors.accent, marginRight: 12, fontSize: 16, fontWeight: '500' }} title="Measures" onPress={() => {
            navigation.navigate("MeasureSettings")
        }} />)
    } as NavigationStackOptions)

    render() {
        return (
            <LinearGradient 
                style={{ flex: 1, alignSelf: 'stretch',  alignItems: 'center', justifyContent: 'center' }}
                colors={Colors.lightBackgroundGradient}>

                <View style={{ flexDirection: 'row', backgroundColor: 'red', height: 50}}>
                    <Text style={StyleTemplates.titleTextStyle}>Data@Hand</Text>
                </View>
            </LinearGradient>
        );
    }
}
