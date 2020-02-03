import { createStackNavigator, HeaderBackButton, TransitionPresets } from 'react-navigation-stack';
import { ExplorationScreen } from './pages/exploration/ExplorationScreen';
import { createAppContainer } from 'react-navigation';
import { SettingsScreen } from './pages/settings/SettingsScreen';
import { ServiceSelectionScreen } from './pages/sources/service-wizard/ServiceSelectionScreen';
import React from 'react';
import { Platform } from 'react-native';

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
          headerLeft: () => <HeaderBackButton onPress={navigation.navigation.dismiss} />
        }),
      },
      ServiceWizardModal: {
        screen: ServiceSelectionScreen,
        navigationOptions: () => ({
          title: "Select Service",
          headerBackTitle: "Back"
        })
      }
    }, {
      initialRouteName: "Main",
      defaultNavigationOptions: {
        ...TransitionPresets.SlideFromRightIOS,
        headerStatusBarHeight: Platform.OS === 'ios'? 4 : 0
      }
    }),
  },
  {
    initialRouteName: 'Home',
    headerMode: 'none',
    defaultNavigationOptions: {
      ...TransitionPresets.ModalPresentationIOS
    }
  }
);

export default createAppContainer(MainStack);
