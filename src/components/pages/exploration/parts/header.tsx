import React from 'react';
import { ExplorationType, ParameterKey, ParameterType, IntraDayDataSourceType, getIntraDayDataSourceName, inferIntraDayDataSourceType, inferDataSource } from "../../../../core/exploration/types";
import { SafeAreaView, View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { CategoricalRow } from '../../../exploration/CategoricalRow';
import { DataSourceIcon } from '../../../common/DataSourceIcon';
import { ExplorationProps } from '../ExplorationScreen';
import { DateRangeBar, DateBar } from '../../../exploration/DateRangeBar';
import { explorationInfoHelper } from '../../../../core/exploration/ExplorationInfoHelper';
import { Button } from 'react-native-elements';
import { Sizes } from '../../../../style/Sizes';
import { StyleTemplates } from '../../../../style/Styles';
import { dataSourceManager } from '../../../../system/DataSourceManager';
import { DataSourceType } from '../../../../measure/DataSourceSpec';
import { createSetRangeAction, setDataSourceAction, InteractionType, goBackAction, setDateAction, setIntraDayDataSourceAction, setCycleTypeAction } from '../../../../state/exploration/interaction/actions';
import Colors from '../../../../style/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';
import { CyclicTimeFrame, cyclicTimeFrameSpecs } from '../../../../core/exploration/data/types';

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
        marginTop: 8,
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
                {generateDataSourceRow(props, false)}
                {generateRangeBar(props)}
            </HeaderContainer>
        case ExplorationType.B_Day:
            return <HeaderContainer>
                {generateIntraDayDataSourceRow(props)}
                {generateDateBar(props)}

            </HeaderContainer>
        case ExplorationType.C_Cyclic:
            return <HeaderContainer>
                {generateCyclicComparisonTypeRow(props)}
                {generateDataSourceRow(props, false)}
                {generateRangeBar(props)}
            </HeaderContainer>
            break;
        case ExplorationType.C_CyclicDetail:
            break;
        case ExplorationType.C_TwoRanges:
            return <HeaderContainer>
                {generateDataSourceRow(props, false)}
                {generateRangeBar(props, ParameterKey.RangeA, true)}
                {generateRangeBar(props, ParameterKey.RangeB)}
            </HeaderContainer>
    }
}

const HeaderContainer = (prop: { children?: any, }) => {

    const dispatch = useDispatch()
    const backStackSize = useSelector((appState: ReduxAppState) => {
        return appState.explorationState.backNavStack.length
    })

    return <SafeAreaView>
        {backStackSize > 0 &&
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

function generateRangeBar(props: ExplorationProps, key?: ParameterKey, showBorder?: boolean): any {
    const range = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.Range, key)
    return <DateRangeBar from={range && range[0]} to={range && range[1]} onRangeChanged={(from, to, xType) => {
        props.dispatchCommand(createSetRangeAction(xType, [from, to], key))
    }} showBorder={showBorder}/>
}

function generateDateBar(props: ExplorationProps): any {
    const date = explorationInfoHelper.getParameterValue<number>(props.explorationState.info, ParameterType.Date)
    return <DateBar date={date != null ? date : null} onDateChanged={(date: number, interactionType: InteractionType) => {
        props.dispatchCommand(setDateAction(interactionType, date))
    }} />
}

function generateDataSourceRow(props: ExplorationProps, showBorder: boolean): any {
    const sourceType = explorationInfoHelper.getParameterValue(props.explorationState.info, ParameterType.DataSource) as DataSourceType
    const sourceSpec = dataSourceManager.getSpec(sourceType)
    return <CategoricalRow title="Data Source" showBorder={showBorder} value={sourceSpec.name}
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

function generateIntraDayDataSourceRow(props: ExplorationProps): any {
    const intraDaySourceType = explorationInfoHelper.getParameterValue<IntraDayDataSourceType>(props.explorationState.info, ParameterType.IntraDayDataSource)
    const sourceTypeName = getIntraDayDataSourceName(intraDaySourceType)
    const supportedIntraDayDataSourceTypes = []
    dataSourceManager.supportedDataSources.forEach(s => {
        const inferred = inferIntraDayDataSourceType(s.type)
        if (supportedIntraDayDataSourceTypes.indexOf(inferred) === -1 && inferred != null) {
            supportedIntraDayDataSourceTypes.push(inferred)
        }
    })

    return <CategoricalRow title="Data Source" showBorder={false} value={sourceTypeName}
        icon={<DataSourceIcon type={inferDataSource(intraDaySourceType)} color="white" size={20} />}
        onSwipeLeft={() => {
            let currentSourceIndex = supportedIntraDayDataSourceTypes.indexOf(intraDaySourceType)
            currentSourceIndex--
            if (currentSourceIndex < 0) {
                currentSourceIndex = supportedIntraDayDataSourceTypes.length - 1
            }
            props.dispatchCommand(setIntraDayDataSourceAction(InteractionType.TouchOnly, supportedIntraDayDataSourceTypes[currentSourceIndex]))
        }}
        onSwipeRight={() => {
            let currentSourceIndex = supportedIntraDayDataSourceTypes.indexOf(intraDaySourceType)
            currentSourceIndex = (currentSourceIndex + 1) % supportedIntraDayDataSourceTypes.length
            props.dispatchCommand(setIntraDayDataSourceAction(InteractionType.TouchOnly, supportedIntraDayDataSourceTypes[currentSourceIndex]))
        }}
    />
}

function generateCyclicComparisonTypeRow(props: ExplorationProps): any {
    const cycleType = explorationInfoHelper.getParameterValue<CyclicTimeFrame>(props.explorationState.info, ParameterType.CycleType)
    const cycles = Object.keys(cyclicTimeFrameSpecs)

    return <CategoricalRow title="Group By" showBorder={true} value={cyclicTimeFrameSpecs[cycleType].name}
        onSwipeLeft={()=>{
            let currentIndex = cycles.indexOf(cycleType)
            currentIndex--
            if(currentIndex < 0){
                currentIndex = cycles.length - 1
            }
            props.dispatchCommand(setCycleTypeAction(InteractionType.TouchOnly, cycles[currentIndex] as any))
        }}

        onSwipeRight={()=>{
            const currentIndex = ( cycles.indexOf(cycleType) + 1 ) % cycles.length
            props.dispatchCommand(setCycleTypeAction(InteractionType.TouchOnly, cycles[currentIndex] as any))
        }}
    />
}