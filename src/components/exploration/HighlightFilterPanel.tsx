import React, { useCallback } from 'react'
import { HighlightFilter } from '../../core/exploration/types'
import { View, StyleSheet, Text, Animated } from 'react-native'
import Colors from '../../style/Colors'
import { DataSourceManager } from '../../system/DataSourceManager'
import { StyleTemplates } from '../../style/Styles'
import { Sizes } from '../../style/Sizes'
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler'


const styles = StyleSheet.create({
    containerStyle: {
        backgroundColor: Colors.red,
    },
    swipeableContainerStyle: {
        backgroundColor: Colors.highlightPanelBackground,
        height: 54,
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
    },
    discardButtonStyle: {
        backgroundColor: Colors.red,
        justifyContent: 'center',
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,

    },
    discardButtonTextStyle: {
        color: 'white',
        fontSize: Sizes.smallFontSize,
        fontWeight: '500',
    }
})

export const HighlightFilterPanel = React.memo((props: {
    filter: HighlightFilter,
    onDiscardFilterPressed: () => void
}) => {

    const dataSourceSpec = DataSourceManager.instance.getSpec(props.filter.dataSource)

    const renderRightActions = useCallback((progress: Animated.Value, dragX) => {
        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp'
          });

        const trans = progress.interpolate({
            inputRange: [0,1],
            outputRange: [100, 0],
            extrapolate: 'clamp'
            
        })

        return <RectButton style={styles.discardButtonStyle} onPress={props.onDiscardFilterPressed}>
            <Animated.Text style={{
                ...styles.discardButtonTextStyle,
                transform: [{translateX: trans}, {scale}]
            }}>Discard</Animated.Text>
        </RectButton>
    }, [props.onDiscardFilterPressed])

    return <Swipeable
        renderRightActions={renderRightActions}
        containerStyle={styles.containerStyle}
    >
        <View style={styles.swipeableContainerStyle}>
            <Text>{dataSourceSpec.name}</Text>
            <Text>{props.filter.type}</Text>
            <Text>{props.filter.ref}</Text>
        </View>
    </Swipeable>
})