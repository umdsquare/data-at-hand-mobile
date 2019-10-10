/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';

import Colors from './src/style/Colors';
import AppNavigator from './src/components/Routes';

const App = () => {
  const usingHermes = typeof HermesInternal === 'object' && HermesInternal !== null;
  console.log("Using Hermes engine.")
  return <AppNavigator/>
};

export default App;
