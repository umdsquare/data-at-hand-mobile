import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";

export interface PropsWithNavigation{
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}