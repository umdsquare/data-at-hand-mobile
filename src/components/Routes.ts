import {createStackNavigator} from 'react-navigation-stack';
import {ExplorationScreen} from './pages/exploration/ExplorationScreen';
import {createAppContainer} from 'react-navigation';
import { MeasureSettingsScreen } from './pages/sources/MeasureSettingsScreen';
import Colors from '../style/Colors';
import { ServiceSelectionWizardStack } from './pages/sources/service-wizard/ServiceSelectionScreen';
import { Sizes } from '../style/Sizes';
import { fromRight, fromBottom } from 'react-navigation-transitions';

const MainStack = createStackNavigator(
  {
    Home: {
      screen: ExplorationScreen,
    },
    MeasureSettings: {
        screen: MeasureSettingsScreen,
        navigationOptions: () => ({
            title: "Data Sources"
        })
    }
  },
  {
    initialRouteName: 'Home',
    headerMode: 'none'
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
