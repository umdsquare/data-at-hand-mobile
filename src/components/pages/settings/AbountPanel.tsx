import React, { useEffect, useState } from 'react'
import { View, Text, ViewStyle, StyleSheet } from 'react-native'
import { Logo } from '@components/Logo'
import { Sizes } from '@style/Sizes'
import Colors from '@style/Colors'

import { getVersion, getBuildNumber } from 'react-native-device-info';

const styles = StyleSheet.create({
    copyrightText: {
        marginTop: Sizes.verticalPadding,
        fontSize: Sizes.tinyFontSize,
        color: Colors.textGray,
        textAlign: 'center',
    },
    versionInfo: {
        marginTop: 18,
        textAlign: 'center',
        color: 'white',
    }
})

export const AboutPanel = React.memo((props: {
    containerStyle?: ViewStyle
}) => {

    const [appVersion, setAppVersion] = useState(null)
    const [buildNumber, setBuildNumber] = useState(null)

    useEffect(() => {
        setAppVersion(getVersion())
        setBuildNumber(getBuildNumber())
    })

    return <View style={{
        backgroundColor: Colors.headerBackground,
        paddingTop: 20,
        ...props.containerStyle
    }}>

        <Logo />
<Text style={styles.versionInfo}>v{appVersion}{__DEV__ === true? " Debug": ""}  |  Build: {buildNumber}</Text>
    
        <Text style={styles.copyrightText}>Copyright © 2020 The Data@Hand Team. All rights reserved.</Text>
    </View>
})