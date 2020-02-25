import { createStackNavigator, HeaderBackButton, TransitionPresets } from '@react-navigation/stack';
import { ExplorationScreen } from './pages/exploration/ExplorationScreen';
import { SettingsScreen } from './pages/settings/SettingsScreen';
import { ServiceSelectionScreen } from './pages/sources/service-wizard/ServiceSelectionScreen';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';


const Stack = createStackNavigator()

const SettingsNavigator = () => {

  const screenOptions = useMemo(() => ({
    ...TransitionPresets.SlideFromRightIOS,
    headerStatusBarHeight: Platform.OS === 'ios' ? 4 : 0
  }), [])

  return <Stack.Navigator initialRouteName="Main"
    screenOptions={screenOptions}>
    <Stack.Screen
      name="Main"
      component={SettingsScreen}
      options={(route) => ({
        title: 'Settings',
        headerBackTitle: 'Back',
        headerLeft: () => <HeaderBackButton onPress={route.navigation.goBack} />
      })} />
    <Stack.Screen
      name="ServiceWizardModal"
      component={ServiceSelectionScreen}
      options={{
        title: "Select Service",
        headerBackTitle: "Back"
      }} />
  </Stack.Navigator>
}

export default () => {
  return <Stack.Navigator initialRouteName="Home" headerMode='none'
    screenOptions={TransitionPresets.ModalPresentationIOS}>
    <Stack.Screen
      name="Home"
      options={{ headerShown: false }}
      component={ExplorationScreen}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsNavigator}
    />

  </Stack.Navigator>
}
