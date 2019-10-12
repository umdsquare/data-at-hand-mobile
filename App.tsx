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
import AppNavigator from './src/components/Routes';
import {makeStore } from './src/state/store';
import { connect, Provider } from 'react-redux';

const store = makeStore()

const App = () => {
  const usingHermes = typeof HermesInternal === 'object' && HermesInternal !== null;
  console.log("Using Hermes engine.")
  return <Provider store = {store}><AppNavigator/></Provider>
};

export default App;
