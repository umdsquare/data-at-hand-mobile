
import React from 'react';
import { StyleSheet, View, Text } from 'react-native'
import { StyleTemplates } from '@style/Styles'
import { Sizes } from '@style/Sizes'
import Colors from '@style/Colors'

export const commonIntraDayPanelStyles = StyleSheet.create({
    containerStyle: { ...StyleTemplates.fillFlex, backgroundColor: 'white' },
    summaryTextGlobalStyle: { textAlign: 'center', fontSize: Sizes.BigFontSize },
    summaryTextTitleStyle: { marginRight: 20, fontSize: Sizes.normalFontSize, color: Colors.textGray },
    summaryTextUnitStyle: { fontSize: Sizes.smallFontSize, color: Colors.textColorLight },

    summaryRowContainerStyle: {
        flexDirection: 'row',
        alignItems: 'baseline',
        minHeight: 60,
        padding: Sizes.horizontalPadding,
        paddingLeft: Sizes.horizontalPadding * 2,
        paddingRight: Sizes.horizontalPadding * 2
    },

    noDataFallbackViewContainerStyle: {
        ...StyleTemplates.fillFlex,
        ...StyleTemplates.contentVerticalCenteredContainer,
        ...StyleTemplates.flexHorizontalCenteredListContainer
    },
    noDataFallbackViewMessageStyle: { fontSize: Sizes.normalFontSize, color: Colors.textColorLight, fontWeight: '400' }
})

export const NoDataFallbackView = () => {
    return <View style={
        commonIntraDayPanelStyles.noDataFallbackViewContainerStyle
    }>
        <Text style={commonIntraDayPanelStyles.noDataFallbackViewMessageStyle}>No data for the day.</Text>
    </View>
}