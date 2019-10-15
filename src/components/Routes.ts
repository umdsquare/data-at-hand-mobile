import {createStackNavigator} from 'react-navigation-stack';
import {HomeScreen} from './pages/HomeScreen';
import {createAppContainer} from 'react-navigation';
import { MeasureSettingsScreen } from './pages/sources/MeasureSettingsScreen';
import Colors from '../style/Colors';
import { ServiceSelectionWizardStack } from './pages/sources/service-wizard/ServiceSelectionScreen';
import { Button } from 'react-native-elements';
import { Sizes } from '../style/Sizes';

const MainStack = createStackNavigator(
  {
    Home: {
      screen: HomeScreen,
      navigationOptions: HomeScreen.navigationOptions
    },
    MeasureSettings: {
        screen: MeasureSettingsScreen,
        navigationOptions: ({navigation}) => ({
            title: "Data Sources"
        })
    }
  },
  {
    initialRouteName: 'Home',
    defaultNavigationOptions: {
        headerTintColor: Colors.accent,
        headerTitleStyle: {
          color: Colors.textColorDark,
          fontSize: Sizes.titleFontSize
        },
        headerBackTitle: 'Back',
        headerStyle: {
          height: 60
        }
    }
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
