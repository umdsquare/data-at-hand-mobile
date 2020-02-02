import React from 'react'
import { View, Text, ViewStyle, StyleSheet } from 'react-native'
import { StyleTemplates } from '../../../../style/Styles'
import Dash from 'react-native-dash';
import Colors from '../../../../style/Colors';

const styles = StyleSheet.create({
    rangeStyle: {
        marginLeft: 20, marginRight: 8, width: 20, height: 20,
        borderBottomColor: Colors.chartLightText, borderBottomWidth: 1,
        borderTopColor: Colors.chartLightText, borderTopWidth: 1,
        backgroundColor: Colors.chartRangeColor
    },
    dashStyle: { width: 20, marginRight: 8 },
    textStyle: {
        color: Colors.textColorLight
    }
})

export const SingleValueElementLegend = (props: { style?: ViewStyle }) => {
    return <View style={StyleTemplates.flexHorizontalCenteredListContainer}>
        <Dash style={styles.dashStyle} dashGap={2} dashLength={2} dashThickness={2} dashColor={Colors.textColorDark} />
        <Text style={styles.textStyle}>Average</Text>
        <View style={styles.rangeStyle} />
        <Text style={styles.textStyle}>Range</Text>

    </View>
}