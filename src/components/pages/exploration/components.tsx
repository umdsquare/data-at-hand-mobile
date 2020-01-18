import React, { Component, ComponentClass } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from "react-native"
import { Sizes } from '../../../style/Sizes';
import { StyleTemplates } from '../../../style/Styles';
import Colors from '../../../style/Colors';
import { measureService } from '../../../system/MeasureService';
import { Button } from 'react-native-elements';
import { MeasureSpec } from '../../../measure/MeasureSpec';
import { Svg, Defs, Path } from 'react-native-svg';
import { SafeAreaConsumer } from 'react-native-safe-area-context';
import { VoiceInputButton } from '../../exploration/VoiceInputButton';

const bottomBarIconSize = 21

const bottomBarButtonStyleBase = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
}

const Styles = StyleSheet.create({
    selectMeasureContainerStyle: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Sizes.verticalPadding
    },
    selectMeasureMainMessageStyle: {
        ...StyleTemplates.titleTextStyle,
        color: Colors.textColorLight
    },

    bottomBarContainerStyle: {
        backgroundColor: "#F5F5F5",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        textShadowOffset: { width: 0, height: -0.5 },
        shadowRadius: 3
    },

    bottomBarInnerListStyle: {
        flexDirection: 'row',
        padding: 0
    },

    bottomBarButtonContainerStyle: {
        alignSelf: 'stretch', alignItems: 'center'
    },

    bottomBarButtonStyleInset: {
        ...bottomBarButtonStyleBase as any,
        paddingTop: 12,
        height: 45
    },

    bottomBarButtonStyleNoInset: {
        ...bottomBarButtonStyleBase as any,
        height: 70
    },

    bottomBarButtonTextStyle: {
        marginTop: 5,
        fontSize: 10
    },

    bottomBarVoiceButtonContainerStyle: {
        position: 'absolute',
        top: -14,
        left: Math.round((Dimensions.get('window').width- Sizes.speechInputButtonSize)/2)
    }
})

export const SelectMeasureComponent = (props: {
    selectableMeasureSpecKeys: Array<string>,
    onMeasureSpecSelected: (spec: MeasureSpec) => void
}) => {
    const measureSpecs = props.selectableMeasureSpecKeys.map(key => measureService.getSpec(key))
    return <View style={Styles.selectMeasureContainerStyle}>
        <Text style={Styles.selectMeasureMainMessageStyle}>Select Measure</Text>

        {
            measureSpecs.map(spec => <Button key={spec.nameKey} type="clear" title={spec.name} onPress={() => {
                props.onMeasureSpecSelected(spec)
            }} />)
        }
    </View>
}

const BottomBarButton = (prop: { isOn: boolean, icon: string, title: string }) => {
    const color = prop.isOn === true ? Colors.primary : Colors.chartLightText
    return <SafeAreaConsumer>
        {
            inset => <View style={inset.bottom > 0 ? Styles.bottomBarButtonStyleInset : Styles.bottomBarButtonStyleNoInset}>
                {prop.isOn===true && <View style={{
                    height: 2, 
                    backgroundColor: Colors.primary, 
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0
                }}/>}<TouchableOpacity style={Styles.bottomBarButtonContainerStyle} onPress={()=>{console.log("haha")}}>
                
                {
                    prop.icon == 'compare' && <Svg width={bottomBarIconSize} height={bottomBarIconSize} viewBox="0 0 153.04 193.85">
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
                    prop.icon == 'browse' && <Svg width={bottomBarIconSize} height={bottomBarIconSize} viewBox="0 0 215.64 215.63">
                        <Path id="Icon_material-pie-chart" data-name="Icon material-pie-chart" d="M108.38,12.21V227.82a108.4,108.4,0,0,1,0-215.61Zm21.88,0v96.92H227A108.28,108.28,0,0,0,130.26,12.21Zm0,118.7v96.92A108.15,108.15,0,0,0,227,130.91Z" transform="translate(-11.33 -12.21)" fill={color} />
                    </Svg>
                }
                <Text style={{
                    ...Styles.bottomBarButtonTextStyle,
                    color: color,
                    fontWeight: prop.isOn === true ? "bold" : "normal"
                }}>{prop.title}</Text>
            </TouchableOpacity>
            </View>
            
        }
    </SafeAreaConsumer >
}

export const BottomBar = (prop: any) => {
    return <View style={Styles.bottomBarContainerStyle}>
        <SafeAreaView style={Styles.bottomBarInnerListStyle}>
            <BottomBarButton isOn={false} title="Browse" icon="browse" />
            <BottomBarButton isOn={true} title="Compare" icon="compare" />
            <View style={Styles.bottomBarVoiceButtonContainerStyle}>
                <VoiceInputButton isBusy={false} onTouchDown={()=>{return null}} onTouchUp={()=>{return null}} />
            </View>
        </SafeAreaView>
    </View>
}