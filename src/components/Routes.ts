import {createStackNavigator} from 'react-navigation-stack';
import {ExplorationScreen} from './pages/exploration/ExplorationScreen';
import {createAppContainer} from 'react-navigation';
import { SettingsScreen } from './pages/settings/SettingsScreen';
import { ServiceSelectionWizardStack } from './pages/sources/service-wizard/ServiceSelectionScreen';

const MainStack = createStackNavigator(
  {
    Home: {
      screen: ExplorationScreen,
      navigationOptions: ({navigation}) => ({
        headerShown: false,
      }),
    },
    Settings: {
        screen: SettingsScreen,
        navigationOptions: () => ({
            title: "Settings",
            headerBackTitle: "Back"
        })
    }
  },
  {
    initialRouteName: 'Home'
  },
);

const RootStack = createStackNavigator({
    Main: {
        screen: MainStack,
    },
    ServiceWizardModal: {
        screen: ServiceSelectionWizardStack
    }
}, {
    mode: 'modal',
    headerMode: 'none'
})

export default createAppContainer(RootStack);
