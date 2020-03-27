/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import AppNavigator from '@components/Routes';
import CreateStore from '@state/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'
import { DataServiceManager } from '@measure/DataServiceManager';
import { VoiceDictator } from '@core/speech/VoiceDictator';
import { ThemeProvider } from 'react-native-elements';
import { Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { theme } from '@style/Theme';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { SystemLogger, VerboseEventTypes } from '@core/logging/SystemLogger';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

setJSExceptionHandler((error, isFatal) => {
  SystemLogger.instance.logVerboseToInteractionStateTransition(isFatal === true ? VerboseEventTypes.FatalError : VerboseEventTypes.NonFatalError, {
    name: error.name,
    message: error.message,
    stack: error.stack
  })
}, true)

setNativeExceptionHandler((exceptionMessage)=>{

})

const { store, persistor } = CreateStore()

class App extends React.Component {

  async componentDidMount() {

    const loadingStartTime = Date.now()
    //loading initial things
    const services = await DataServiceManager.instance.getServicesSupportedInThisSystem()

    const speechInstalled = await VoiceDictator.instance.install()
    if (speechInstalled === true) {
      const isAvailableInSystem = await VoiceDictator.instance.isAvailableInSystem()
      if (isAvailableInSystem === true) {
        console.log("Speech recognition is available on this system.")
      }
    }
    console.log("initial loading finished in ", Date.now() - loadingStartTime, "milis.")
  }

  async componentWillUnmount() {
    await VoiceDictator.instance.uninstall()
  }

  render() {
    return <NavigationContainer>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider theme={theme}>
                <AppNavigator />
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </NavigationContainer>
  }
};

export default App;
