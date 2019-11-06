import React from 'react';
import { View, Text, StyleSheet } from "react-native"
import { Sizes } from '../../../style/Sizes';
import { StyleTemplates } from '../../../style/Styles';
import Colors from '../../../style/Colors';
import { measureService } from '../../../system/MeasureService';
import { Button } from 'react-native-elements';
import { MeasureSpec } from '../../../measure/MeasureSpec';

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