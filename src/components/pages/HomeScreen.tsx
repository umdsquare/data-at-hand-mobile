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
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Logo } from '../Logo';
import { PropsWithNavigation } from '../../PropsWithNavigation';

const appBarIconStyles = {
    buttonStyle: {
        width: 36,
        height: 36,
        padding: 0,
        paddingTop: 2,
        paddingLeft: 1,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightFormBackground
    } as any,
    iconSize: 20,
    iconColor: Colors.textColorLight
}


export class HomeScreen extends React.Component<PropsWithNavigation> {

    static navigationOptions = ({ navigation }) => ({
        headerLeft: (<Logo />),
        headerLeftContainerStyle: {paddingLeft: Sizes.horizontalPadding},
        headerRight: (
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingRight: 12
            }}>
                <Button
                    buttonStyle={appBarIconStyles.buttonStyle}
                    containerStyle={{ marginRight: 8 }}
                    icon={
                        <AntDesignIcon name="setting" size={appBarIconStyles.iconSize} color={appBarIconStyles.iconColor} />
                    }
                    onPress={() => {
                        navigation.getParam('openConfigSheet')()
                    }} />

                <Button
                    buttonStyle={{ ...appBarIconStyles.buttonStyle, backgroundColor: Colors.accent }}
                    icon={
                        <MaterialIcon name="more-horiz" size={appBarIconStyles.iconSize} color="white" />
                    }
                    onPress={() => {
                        navigation.navigate("MeasureSettings")
                    }} />
            </View>
        )
    } as NavigationStackOptions)

    private _configSheetRef: RBSheet = null

    componentDidMount() {
        this.props.navigation.setParams({openConfigSheet: this._openConfigSheet})
    }

    _closeConfigSheet = () => {
        if (this._configSheetRef) {
            this._configSheetRef.close()
        }
    }


    _openConfigSheet = () => {
        if (this._configSheetRef) {
            this._configSheetRef.open()
        }
    }

    render() {
        return (
            <LinearGradient
                style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}
                colors={Colors.lightBackgroundGradient}>

                <RBSheet ref={
                    ref => {
                        this._configSheetRef = ref
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
                        <Text style={StyleTemplates.titleTextStyle}>Settings</Text>
                        <Button buttonStyle={{
                            backgroundColor: 'transparent'
                        }}
                            icon={<AntDesignIcon name="closecircle" size={26} color={Colors.lightFormBackground} />}
                            onPress={() => this._closeConfigSheet()}
                        />
                    </View>
                    <ConfigurationPanel />
                </RBSheet>
            </LinearGradient>
        );
    }
}
