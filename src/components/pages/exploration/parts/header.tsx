import React, { useEffect } from 'react';
import { ExplorationType, ParameterKey, ParameterType, IntraDayDataSourceType, getIntraDayDataSourceName, inferIntraDayDataSourceType, inferDataSource } from "../../../../core/exploration/types";
import { SafeAreaView, View, Text, StyleSheet, TextStyle, ViewStyle, LayoutAnimation } from 'react-native';
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
import { createSetRangeAction, setDataSourceAction, InteractionType, goBackAction, setDateAction, setIntraDayDataSourceAction, setCycleTypeAction, setCycleDimensionAction } from '../../../../state/exploration/interaction/actions';
import Colors from '../../../../style/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';
import { CyclicTimeFrame, cyclicTimeFrameSpecs, CycleDimension, getFilteredCycleDimensionList, getHomogeneousCycleDimensionList, getCycleDimensionSpec } from '../../../../core/exploration/cyclic_time';
import { SvgIcon, SvgIconType } from '../../../common/svg/SvgIcon';

const titleBarOptionButtonIconInfo = <SvgIcon type={SvgIconType.Settings} size={22} color={'white'}/>

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
        margin: 0
    }
})

const backButtonProps = {
    icon: <SvgIcon color={Colors.headerBackgroundDarker} size={18} type={SvgIconType.ArrowLeft} />,
    containerStyle: {
        marginTop: 8,
        marginBottom: 8,
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

export const ExplorationViewHeader = (props: ExplorationProps) => {
    useEffect(() => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(
                500, LayoutAnimation.Types.easeInEaseOut, "opacity")
        )

    }, [props.explorationState.info.type])

    return generateHeaderView(props)
}

export function generateHeaderView(props: ExplorationProps): any {
    switch (props.explorationState.info.type) {
        case ExplorationType.B_Overview:
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
                {generateDataSourceRow(props, true)}
                {generateCyclicComparisonTypeRow(props, false)}
                {generateRangeBar(props)}
            </HeaderContainer>
            break;
        case ExplorationType.C_CyclicDetail_Daily:
        case ExplorationType.C_CyclicDetail_Range:
            return <HeaderContainer>
                {generateDataSourceRow(props, true)}
                {generateCycleDimensionRow(props, false)}
                {generateRangeBar(props)}
            </HeaderContainer>
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
    }} showBorder={showBorder} />
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
        IconComponent={DataSourceIcon}
        iconProps={(index) => {
            return {
                type: dataSourceManager.supportedDataSources[index].type,
            }
        }}
        values={dataSourceManager.supportedDataSources.map(spec => spec.name)}
        onValueChange={(newValue, newIndex) =>
            props.dispatchCommand(setDataSourceAction(InteractionType.TouchOnly, dataSourceManager.supportedDataSources[newIndex].type))
        }
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
    const values = supportedIntraDayDataSourceTypes.map(type => getIntraDayDataSourceName(type))

    return <CategoricalRow title="Data Source" showBorder={false} value={sourceTypeName}
        IconComponent={DataSourceIcon}
        iconProps={(index) => {
            console.log("inferred: ", index, supportedIntraDayDataSourceTypes[index])
            return {
                type: inferDataSource(supportedIntraDayDataSourceTypes[index])
            }
        }}
        values={values}
        onValueChange={(value, index) => {
            props.dispatchCommand(setIntraDayDataSourceAction(InteractionType.TouchOnly, supportedIntraDayDataSourceTypes[index]))
        }}
    />
}

function generateCyclicComparisonTypeRow(props: ExplorationProps, showBorder: boolean): any {
    const cycleType = explorationInfoHelper.getParameterValue<CyclicTimeFrame>(props.explorationState.info, ParameterType.CycleType)
    const cycles = Object.keys(cyclicTimeFrameSpecs)

    return <CategoricalRow title="Group By" showBorder={showBorder} value={cyclicTimeFrameSpecs[cycleType].name}
        values={cycles.map(key => cyclicTimeFrameSpecs[key].name)}
        onValueChange={(value, index) => {
            props.dispatchCommand(setCycleTypeAction(InteractionType.TouchOnly, cycles[index] as any))
        }}
    />
}

function generateCycleDimensionRow(props: ExplorationProps, showBorder: boolean): any {
    const cycleDimension = explorationInfoHelper.getParameterValue<CycleDimension>(props.explorationState.info, ParameterType.CycleDimension)
    const spec = getCycleDimensionSpec(cycleDimension)
    const selectableDimensions = getHomogeneousCycleDimensionList(cycleDimension)

    return <CategoricalRow title="Cycle Filter" showBorder={showBorder} value={spec.name}
        values={selectableDimensions.map(spec => spec.name)}
        onValueChange={(value, index) => {
            props.dispatchCommand(setCycleDimensionAction(InteractionType.TouchOnly, selectableDimensions[index].dimension))
        }}
    />

}