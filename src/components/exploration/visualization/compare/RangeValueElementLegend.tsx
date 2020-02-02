import React from 'react'
import { View, Text, ViewStyle, StyleSheet } from 'react-native'
import { StyleTemplates } from '../../../../style/Styles'
import Dash from 'react-native-dash';
import Colors from '../../../../style/Colors';
import { Sizes } from '../../../../style/Sizes';

const rangeStyleBase = {
    marginRight: 8, width: 20, height: 20,
    borderBottomColor: Colors.chartLightText, borderBottomWidth: 1,
    borderTopColor: Colors.chartLightText, borderTopWidth: 1,
    backgroundColor: Colors.chartRangeColor
}

const styles = StyleSheet.create({
    containerStyle: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    rangeAStyle: {
        ...rangeStyleBase,
        backgroundColor: Colors.chartRangeAColor
    },
    rangeBStyle: {
        ...rangeStyleBase,
        backgroundColor: Colors.chartRangeBColor
    },
    dashStyle: { width: 20, marginRight: 8 },
    textStyle: {
        fontSize: Sizes.smallFontSize,
        color: Colors.textColorLight
    }
})

export const RangeValueElementLegend = (props: { style?: ViewStyle, rangeALabel?: string, rangeBLabel?: string }) => {
    return <View style={styles.containerStyle}>
        <View style={StyleTemplates.flexHorizontalCenteredListContainer}>
            <Dash style={styles.dashStyle} dashGap={2} dashLength={2} dashThickness={2} dashColor={Colors.textColorDark} />
            <Text style={styles.textStyle}>Avg.</Text>
        </View>

        <View style={StyleTemplates.flexHorizontalCenteredListContainer}>
            <View style={styles.rangeAStyle} />
            <Text style={styles.textStyle}>{props.rangeALabel}</Text>
        </View>


        <View style={StyleTemplates.flexHorizontalCenteredListContainer}>
            <View style={styles.rangeBStyle} />
            <Text style={styles.textStyle}>{props.rangeBLabel}</Text>
        </View>
    </View>
}