import React from 'react';
import { View, ViewStyle } from 'react-native';
import * as Progress from 'react-native-progress';
import Colors from '../../style/Colors';

const constainerStyle = { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000 } as ViewStyle
export const BusyHorizontalIndicator = () => {
    return <View style={constainerStyle}>
        <Progress.Bar indeterminate={true} width={null} height={3} color={Colors.primary} unfilledColor={Colors.primary + "55"} useNativeDriver={true} borderRadius={0} borderWidth={0} />
    </View>
}