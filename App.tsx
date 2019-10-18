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
import { sourceManager } from './src/system/SourceManager';
import { FadeView } from './src/components/common/FadeView';
import { voiceDictator } from './src/speech/VoiceDictator';
import { sleep } from './src/utils';
import { naturalLanguageRecognizer } from './src/speech/NaturalLanguageRecognizer';

const { store, persistor } = CreateStore()

interface State{
  isLoading: boolean
}

class App extends React.Component<any, State> {

  constructor(props){
    super(props)

    this.state = {
      isLoading: true
    }
  }

  async componentDidMount(){

    const loadingStartTime = Date.now()
    //loading initial things
    const services = await sourceManager.getServicesSupportedInThisSystem()
    const speechInstalled = await voiceDictator.install()
    if(speechInstalled === true){
      const isAvailableInSystem = await voiceDictator.isAvailableInSystem()
      if(isAvailableInSystem === true){
        console.log("Speech recognition is available on this system.")
      }
    }
    await naturalLanguageRecognizer.initialize()
    this.setState({isLoading: false})

    console.log("initial loading finished in ", Date.now() - loadingStartTime, "milis.")
  }

  render() {
    const usingHermes = typeof HermesInternal === 'object' && HermesInternal !== null;
    if (usingHermes === true) console.log("Using Hermes engine.")

    return <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppNavigator />
        {<FadeView 
          visible={this.state.isLoading}
          fadeDuration={500}
          style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255, 0.4)',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <LottieView
            source={require("./assets/lottie/109-bouncy-loader.json")} autoPlay loop
          />
        </FadeView>}
      </PersistGate>
    </Provider>
  }
};

export default App;
