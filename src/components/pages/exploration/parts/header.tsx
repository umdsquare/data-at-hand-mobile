import React from 'react';
import { ExplorationType, ParameterKey, ParameterType } from "../../../../core/exploration/types";
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { CategoricalRow } from '../../../exploration/CategoricalRow';
import { DataSourceIcon } from '../../../common/DataSourceIcon';
import { ExplorationProps } from '../ExplorationScreen';
import { DateRangeBar } from '../../../exploration/DateRangeBar';
import { explorationInfoHelper } from '../../../../core/exploration/ExplorationInfoHelper';
import { startOfDay, endOfDay } from 'date-fns';
import { Button } from 'react-native-elements';
import { Sizes } from '../../../../style/Sizes';
import { StyleTemplates } from '../../../../style/Styles';
import { DateTimeHelper } from '../../../../time';
import { dataSourceManager } from '../../../../system/DataSourceManager';
import { DataSourceType } from '../../../../measure/DataSourceSpec';
import {createSetRangeAction} from '../../../../state/exploration/interaction/actions';

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
            return <SafeAreaView>
                {generateDataSourceRow(props)}
                {generateRangeBar(props)}
            </SafeAreaView>
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
    const range = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.Range, key)
    return <DateRangeBar from={range && startOfDay(DateTimeHelper.toDate(range[0]))} to={range && endOfDay(DateTimeHelper.toDate(range[1]))} onRangeChanged={(from, to, xType) => {
        props.dispatchCommand(createSetRangeAction(xType, [DateTimeHelper.toNumberedDateFromDate(from), DateTimeHelper.toNumberedDateFromDate(to)], key))
    }} />
}

function generateDataSourceRow(props: ExplorationProps): any {
    const sourceType = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.DataSource) as DataSourceType
    const sourceSpec = dataSourceManager.getSpec(sourceType)
    return <CategoricalRow title="Data Source" showBorder={true} value={sourceSpec.name} icon={<DataSourceIcon type={sourceType} color="white" size={20} />} />
}

function generateComparisonTypeRow(props: ExplorationProps): any {
    return <CategoricalRow title="Comparison Type" showBorder={false} value="Two Date Ranges" />
}