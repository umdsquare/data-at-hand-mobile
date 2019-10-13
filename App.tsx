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
import CreateStore from './src/state/store';
import { connect, Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'

const { store, persistor } = CreateStore()

const App = () => {
  const usingHermes = typeof HermesInternal === 'object' && HermesInternal !== null;
  if(usingHermes === true ) console.log("Using Hermes engine.")
  
  return <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppNavigator />
    </PersistGate>
  </Provider>
};

export default App;
