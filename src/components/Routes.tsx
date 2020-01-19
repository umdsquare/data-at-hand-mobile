import {createStackNavigator, HeaderBackButton} from 'react-navigation-stack';
import {ExplorationScreen} from './pages/exploration/ExplorationScreen';
import {createAppContainer} from 'react-navigation';
import {SettingsScreen} from './pages/settings/SettingsScreen';
import {ServiceSelectionScreen} from './pages/sources/service-wizard/ServiceSelectionScreen';
import { Button } from 'react-native-elements';
import React from 'react';

const MainStack = createStackNavigator(
  {
    Home: {
      screen: ExplorationScreen,
      navigationOptions: {
        headerShown: false
      }
    },
    Settings: createStackNavigator({
      Main: {
        screen: SettingsScreen,
        navigationOptions: (navigation) => ({
          title: 'Settings',
          headerBackTitle: 'Back',
          headerLeft: ()=> <HeaderBackButton onPress={navigation.navigation.dismiss}/>
        }),
      },
      ServiceWizardModal: {
        screen: ServiceSelectionScreen,
        navigationOptions: () => ({
          title: "Select Service",
          headerBackTitle: "Back"
        })
      }
    }, {initialRouteName: "Main"}),
  },
  {
    initialRouteName: 'Home',
    headerMode: 'none'
  },
);

export default createAppContainer(MainStack);
