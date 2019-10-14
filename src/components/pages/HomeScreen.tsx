import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-elements';
import Colors from '../../style/Colors';
import { StyleTemplates } from '../../style/Styles';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationStackOptions } from 'react-navigation-stack';
import RBSheet from "react-native-raw-bottom-sheet";
import { ConfigurationPanel } from './settings/ConfigurationPanel';
import { Sizes } from '../../style/Sizes';
import Icon from 'react-native-vector-icons/AntDesign';

export class HomeScreen extends React.Component {

    configSheetRef: RBSheet

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
                style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}
                colors={Colors.lightBackgroundGradient}>

                <Button title="Settings" onPress={(ev) => { this.configSheetRef.open() }} />
                <RBSheet ref={
                    ref => {
                        this.configSheetRef = ref
                    }}
                    duration={240}
                    animationType="fade"
                    customStyles={
                        {
                            container: {
                                borderTopStartRadius: 8,
                                borderTopEndRadius: 8,
                                backgroundColor: Colors.lightBackground
                            }
                        }
                    }
                >

                    <View style={{
                        flexDirection: 'row',
                        padding: Sizes.horizontalPadding,
                        paddingTop: Sizes.verticalPadding,
                        paddingRight: 10,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={StyleTemplates.hugeTitleTextStyle}>Settings</Text>
                        <Button buttonStyle={{
                            backgroundColor: 'transparent'
                        }}
                            icon={<Icon name="closecircle" size={26} color={Colors.lightFormBackground} />}
                            onPress={() => this.configSheetRef.close()}
                        />
                    </View>
                    <ConfigurationPanel />
                </RBSheet>
            </LinearGradient>
        );
    }
}
