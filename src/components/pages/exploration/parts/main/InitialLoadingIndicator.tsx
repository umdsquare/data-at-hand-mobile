import React from 'react';
import { ViewStyle, View, Text, StyleSheet } from "react-native";
import Spinner from 'react-native-spinkit';
import Colors from '@style/Colors';
import { StyleTemplates } from '@style/Styles';
import { Sizes } from '@style/Sizes';
import { ZIndices } from '../zIndices';

const styles = StyleSheet.create({
    container: {
        ...StyleTemplates.fitParent,
        ...StyleTemplates.contentVerticalCenteredContainer,
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        backgroundColor: '#ffffff50',
        zIndex: ZIndices.TooltipOverlay,
    },

    popup: {
        backgroundColor: Colors.headerBackground + "cc",
        padding: Sizes.horizontalPadding,
        borderRadius: 8,
        width: '50%',
        alignItems: 'center',
        elevation: 8,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 4,
        shadowOpacity: 0.2
    },
    message: {
        marginTop: 16,
        fontSize: Sizes.tinyFontSize,
        fontWeight: '500',
        color: Colors.WHITE
    }
})

export const InitialLoadingIndicator = (props: {
    loadingMessage?: string,
    style?: ViewStyle
}) => {
    return <View style={styles.container}>
        <View style={styles.popup}>
            <Spinner type="9CubeGrid" color={Colors.WHITE} />
            {<Text style={styles.message}>{props.loadingMessage || "Preparing..."}</Text>}
        </View>
    </View>
}