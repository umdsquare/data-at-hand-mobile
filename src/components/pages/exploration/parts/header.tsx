import React from 'react';
import { ExplorationType, ParameterKey, ParameterType } from "../../../../core/interaction/types";
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { CategoricalRow } from '../../../exploration/CategoricalRow';
import { DataSourceIcon } from '../../../common/DataSourceIcon';
import { ExplorationProps } from '../ExplorationScreen';
import { DateRangeBar } from '../../../exploration/DateRangeBar';
import { explorationCommandResolver } from '../../../../core/interaction/ExplorationCommandResolver';
import { startOfDay, endOfDay } from 'date-fns';
import { createSetRangeCommand } from '../../../../core/interaction/commands';
import { Button } from 'react-native-elements';
import { Sizes } from '../../../../style/Sizes';
import { StyleTemplates } from '../../../../style/Styles';

const titleBarOptionButtonIconInfo = {
    name: "ios-settings",
    type: "ionicon",
    size: 23,
    color: 'white'
}


const styles = StyleSheet.create({
    titleBarStyle: {
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
    },
    titleBarTitleStyle: {
        ...StyleTemplates.headerTitleStyle,
        flex: 1
    },

    titleBarButtonContainerStyle: {
        marginLeft: 8
    },

    titleBarButtonStyle: {
        backgroundColor: '#ffffff64',
        width: 28,
        height: 28,
        borderRadius: 14,
        padding: 0,
        paddingTop:2,
        margin: 0
    }
})

export function generateHeaderView(props: ExplorationProps): any {
    switch (props.explorationState.info.type) {
        case ExplorationType.B_Ovrvw:
            return <SafeAreaView>
                <View style={styles.titleBarStyle}>
                    <Text style={styles.titleBarTitleStyle}>Browse</Text>
                    <Button 
                        buttonStyle={styles.titleBarButtonStyle} 
                        containerStyle={styles.titleBarButtonContainerStyle}
                        icon={titleBarOptionButtonIconInfo}
                        onPress={() => {
                            props.navigation.navigate("Settings")
                        }} />
                </View>
                {generateRangeBar(props)}
            </SafeAreaView>
        case ExplorationType.B_Range:
            break;
        case ExplorationType.B_Day:
            break;
        case ExplorationType.C_Cyclic:
            break;
        case ExplorationType.C_CyclicDetail:
            break;
        case ExplorationType.C_TwoRanges:
            break;
    }
}

function generateRangeBar(props: ExplorationProps, key?: ParameterKey): any {
    const range = explorationCommandResolver.getParameterValue(props.explorationState.info, ParameterType.Range, key)
    return <DateRangeBar from={range && startOfDay(new Date(range[0]))} to={range && endOfDay(new Date(range[1]))} onRangeChanged={(from, to) => {
        props.dispatchCommand(createSetRangeCommand([from, to], key))
    }} />
}

function generateDataSourceRow(props: ExplorationProps): any {
    return <CategoricalRow title="DataSource" showBorder={true} value="Step Count" icon={<DataSourceIcon type="step" color="white" size={20} />} />
}

function generateComparisonTypeRow(props: ExplorationProps): any {
    return <CategoricalRow title="Comparison Type" showBorder={false} value="Two Date Ranges" />
}