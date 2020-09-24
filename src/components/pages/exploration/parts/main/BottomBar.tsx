import React from 'react';
import { View, SafeAreaView, StyleSheet, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import Colors from '@style/Colors';
import { Sizes, sizeByScreen } from '@style/Sizes';
import { StyleTemplates } from '@style/Styles';
import Svg, { Path, Polygon } from 'react-native-svg';
import { VoiceInputButton } from '@components/exploration/VoiceInputButton';
import { ExplorationMode } from '@data-at-hand/core/exploration/ExplorationInfo';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '@state/types';
import { SpeechRecognizerSessionStatus } from '@state/speech/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZIndices } from '@components/pages/exploration/parts/zIndices';

const bottomBarIconSize = sizeByScreen(21, 19)

const Styles = StyleSheet.create({
    bottomBarContainerStyle: {
        backgroundColor: "#F5F5F5",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: -1 },
        shadowRadius: 3,
        elevation: 4,
        overflow: "visible",
        borderTopColor: Platform.OS === 'android' ? '#00000020' : null,
        borderTopWidth: Platform.OS === 'android' ? 1 : null,
    },

    bottomBarInnerListStyle: {
        flexDirection: 'row',
        padding: 0
    },

    bottomBarButtonContainerStyle: {
        alignSelf: 'stretch', alignItems: 'center'
    },

    bottomBarButtonStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    bottomBarButtonTextStyle: {
        marginTop: 5,
        fontSize: 10
    },

    bottomBarVoiceButtonContainerStyle: {
        position: 'absolute',
        top: -14,
        left: Math.round((Dimensions.get('window').width - Sizes.speechInputButtonSize) / 2),
        zIndex: ZIndices.Footer
    },
})

interface Props {
    mode: ExplorationMode,
    onModePressIn?: (mode: ExplorationMode) => void,
    onModePressOut?: (mode: ExplorationMode) => void,
    onModePress?: (mode: ExplorationMode) => void,
    onVoiceButtonPressIn?: () => void,
    onVoiceButtonPressOut?: () => void
}

export const BottomBar = (props: Props) => {
    const speechSessionStatus = useSelector((state: ReduxAppState) => state.speechRecognizerState.status)

    return <View style={Styles.bottomBarContainerStyle} removeClippedSubviews={false}>
        <SafeAreaView style={Styles.bottomBarInnerListStyle}>
            <BottomBarButton isOn={props.mode === 'browse'} title="Home" mode={ExplorationMode.Browse} onPress={() => { props.onModePress(ExplorationMode.Browse) }} />
            <BottomBarButton isOn={props.mode === 'compare'} title="Compare" mode={ExplorationMode.Compare} onPress={() => { props.onModePress(ExplorationMode.Compare) }} />
            <View style={Styles.bottomBarVoiceButtonContainerStyle}>
                <VoiceInputButton isBusy={speechSessionStatus === SpeechRecognizerSessionStatus.Analyzing} onTouchDown={props.onVoiceButtonPressIn} onTouchUp={props.onVoiceButtonPressOut} />
            </View>
        </SafeAreaView>
    </View>
}


const BottomBarButton = (prop: { isOn: boolean, mode: ExplorationMode, title: string, onPress?: () => void }) => {
    //const color = prop.isOn === true ? Colors.primary : Colors.chartLightText
    const color = Colors.textGray

    const insets = useSafeAreaInsets()

    return <View style={[Styles.bottomBarButtonStyle, {
        paddingTop: insets.bottom > 0 ? 12 : 0,
        height: insets.bottom > 0 ? 45 : sizeByScreen(70, 65),
    }]}>
        <TouchableOpacity style={Styles.bottomBarButtonContainerStyle} onPress={prop.onPress}>

            {
                prop.mode == 'compare' && <Svg width={bottomBarIconSize} height={bottomBarIconSize} viewBox="0 0 153.04 193.85">
                    <Path id="Rectangle_763" data-name="Rectangle 763"
                        d="M54,24.09h51a10.21,10.21,0,0,1,10.2,10.21V218H43.79V34.3A10.21,10.21,0,0,1,54,24.09Z"
                        transform="translate(-43.79 -24.09)"
                        fill={color}
                    />
                    <Path id="Rectangle_764" data-name="Rectangle 764" d="M135.62,85.31h51a10.2,10.2,0,0,1,10.2,10.2V218H125.41V95.51A10.21,10.21,0,0,1,135.62,85.31Z"
                        transform="translate(-43.79 -24.09)"
                        fill={color}
                    />
                </Svg>
            }
            {
                prop.mode == 'browse' && <Svg width={bottomBarIconSize} height={bottomBarIconSize} viewBox="0 0 24 24">
                    <Path d="M22.5,13.7c-0.3,0-0.6-0.1-0.9-0.4L12,4.1l-9.6,9.2c-0.5,0.5-1.3,0.5-1.8,0c-0.5-0.5-0.5-1.3,0-1.8L11.1,1.3
	c0.5-0.5,1.3-0.5,1.8,0l10.5,10.1c0.5,0.5,0.5,1.3,0,1.8C23.2,13.5,22.9,13.7,22.5,13.7z" fill={color} />
                    <Polygon points="4.4,12.9 12,5.6 19.6,12.9 19.6,23 4.4,23 " fill={color} />
                </Svg>
            }
            <Text style={{
                ...Styles.bottomBarButtonTextStyle,
                color: color,
                fontWeight: "bold"
            }}>{prop.title}</Text>
        </TouchableOpacity>
    </View>
}