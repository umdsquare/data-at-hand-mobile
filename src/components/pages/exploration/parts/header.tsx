import React from 'react';
import { ExplorationType, ParameterKey, ParameterType } from "../../../../core/exploration/types";
import { SafeAreaView, View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { CategoricalRow } from '../../../exploration/CategoricalRow';
import { DataSourceIcon } from '../../../common/DataSourceIcon';
import { ExplorationProps } from '../ExplorationScreen';
import { DateRangeBar, DateBar } from '../../../exploration/DateRangeBar';
import { explorationInfoHelper } from '../../../../core/exploration/ExplorationInfoHelper';
import { startOfDay, endOfDay } from 'date-fns';
import { Button } from 'react-native-elements';
import { Sizes } from '../../../../style/Sizes';
import { StyleTemplates } from '../../../../style/Styles';
import { DateTimeHelper } from '../../../../time';
import { dataSourceManager } from '../../../../system/DataSourceManager';
import { DataSourceType } from '../../../../measure/DataSourceSpec';
import { createSetRangeAction, setDataSourceAction, InteractionType, goBackAction, setDateAction } from '../../../../state/exploration/interaction/actions';
import Colors from '../../../../style/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';

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
        paddingTop: 2,
        margin: 0
    }
})

const backButtonProps = {
    icon: { type: 'materialicon', size: 18, name: 'keyboard-arrow-left', color: Colors.headerBackgroundDarker, containerStyle: { padding: 0, margin: 0 } },
    containerStyle: {
        alignSelf: 'flex-start',
        marginLeft: Sizes.horizontalPadding - 4
    } as ViewStyle,

    buttonStyle: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 2,
        paddingRight: 12,
        borderRadius: 50,
        backgroundColor: '#FFFFFFdd'
    },
    titleStyle: {
        color: Colors.headerBackground,
        fontSize: Sizes.tinyFontSize,
        fontWeight: 'bold'
    } as TextStyle
}

export function generateHeaderView(props: ExplorationProps): any {
    switch (props.explorationState.info.type) {
        case ExplorationType.B_Ovrvw:
            return <HeaderContainer>
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
            </HeaderContainer>
        case ExplorationType.B_Range:
            return <HeaderContainer>
                {generateDataSourceRow(props)}
                {generateRangeBar(props)}
            </HeaderContainer>
        case ExplorationType.B_Day:
            return <HeaderContainer>
                {generateDataSourceRow(props)}
                {generateDateBar(props)}

            </HeaderContainer>
        case ExplorationType.C_Cyclic:
            break;
        case ExplorationType.C_CyclicDetail:
            break;
        case ExplorationType.C_TwoRanges:
            break;
    }
}

const HeaderContainer = (prop: { children?: any, }) => {

    const dispatch = useDispatch()
    const backStackSize = useSelector((appState: ReduxAppState) => {
        return appState.explorationState.backNavStack.length
    })

    return <SafeAreaView>
        { backStackSize > 0 &&
            <Button title="Back"
                {...backButtonProps}
                onPress={() => {
                    dispatch(goBackAction())
                }}
            />
        }
        {prop.children}
    </SafeAreaView>
}

function generateRangeBar(props: ExplorationProps, key?: ParameterKey): any {
    const range = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.Range, key)
    return <DateRangeBar from={range && range[0]} to={range && range[1]} onRangeChanged={(from, to, xType) => {
        props.dispatchCommand(createSetRangeAction(xType, [from, to], key))
    }} />
}

function generateDateBar(props: ExplorationProps): any {
    const date = explorationInfoHelper.getParameterValue<number>(props.explorationState.info, ParameterType.Date)
    return <DateBar date={date !=null? date : null} onDateChanged={(date: number, interactionType: InteractionType)=>{
        props.dispatchCommand(setDateAction(interactionType, date))
    }}/>
}

function generateDataSourceRow(props: ExplorationProps): any {
    const sourceType = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.DataSource) as DataSourceType
    const sourceSpec = dataSourceManager.getSpec(sourceType)
    return <CategoricalRow title="Data Source" showBorder={true} value={sourceSpec.name}
        icon={<DataSourceIcon type={sourceType} color="white" size={20} />}
        onSwipeLeft={() => {
            let currentSourceIndex = dataSourceManager.supportedDataSources.findIndex(spec => spec.type === sourceType)
            currentSourceIndex--
            if (currentSourceIndex < 0) {
                currentSourceIndex = dataSourceManager.supportedDataSources.length - 1
            }
            props.dispatchCommand(setDataSourceAction(InteractionType.TouchOnly, dataSourceManager.supportedDataSources[currentSourceIndex].type))
        }}
        onSwipeRight={() => {
            let currentSourceIndex = dataSourceManager.supportedDataSources.findIndex(spec => spec.type === sourceType)
            currentSourceIndex = (currentSourceIndex + 1) % dataSourceManager.supportedDataSources.length
            props.dispatchCommand(setDataSourceAction(InteractionType.TouchOnly, dataSourceManager.supportedDataSources[currentSourceIndex].type))
        }}
    />
}

function generateComparisonTypeRow(props: ExplorationProps): any {
    return <CategoricalRow title="Comparison Type" showBorder={false} value="Two Date Ranges" />
}