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
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'
import LottieView from 'lottie-react-native';
import { DataServiceManager } from './src/system/DataServiceManager';
import { FadeView } from './src/components/common/FadeView';
import { VoiceDictator } from './src/core/speech/VoiceDictator';
import { naturalLanguageRecognizer } from './src/core/speech/NaturalLanguageRecognizer';
import { ThemeProvider } from 'react-native-elements';
import { theme } from './src/style/Theme';
import { Platform, UIManager } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Spinner from 'react-native-spinkit';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { store, persistor } = CreateStore()

interface State {
  isLoading: boolean
}

class App extends React.Component<any, State> {

  constructor(props) {
    super(props)

    this.state = {
      isLoading: true
    }
  }

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
    this.setState({ isLoading: false })
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
              <ActionSheetProvider>
                <AppNavigator />
              </ActionSheetProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </NavigationContainer>
  }
};

export default App;
