import { PropsWithNavigation } from "../../../PropsWithNavigation";
import React from "react";
import { StatusBar, View, StyleSheet, Text, Platform, SafeAreaView } from "react-native";
import Colors from "../../../style/Colors";
import { StyleTemplates } from "../../../style/Styles";
import { BottomBar } from "./components";
import { Button } from "react-native-elements";

const styles = StyleSheet.create({

    headerContainerStyle: {
        backgroundColor: Colors.headerBackground,
        
    },

    mainContainerStyle: {
        ...StyleTemplates.screenDefaultStyle,
        zIndex: Platform.OS === 'android' ? 100 : undefined, 
    }
})

interface Props extends PropsWithNavigation{
}

interface State {
}


export class ExplorationScreen extends React.Component<Props, State> {



    render(){
        return <View style={StyleTemplates.screenDefaultStyle}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBackground} />
            <View style={styles.headerContainerStyle}>
                <SafeAreaView>
                    <View style={{padding: 12, flexDirection: 'row'}}>
                        <Text style={{flex: 1}}>Browse</Text>
                        <Button onPress={()=>{
                            this.props.navigation.navigate("Settings")
                        }}></Button>
                    </View>
                </SafeAreaView>
            </View>
            <View style={styles.mainContainerStyle}></View>

            <BottomBar/>

        </View>
    }
}