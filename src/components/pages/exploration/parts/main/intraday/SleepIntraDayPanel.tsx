import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutRectangle, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../../../state/types';
import { IDailySleepSummaryEntry, SleepStage } from '../../../../../../core/exploration/data/types';
import { commonIntraDayPanelStyles } from './common';
import { SizeWatcher } from '../../../../../visualization/SizeWatcher';
import { Sizes } from '../../../../../../style/Sizes';
import Svg, { G, Line, Text as SvgText, Rect } from 'react-native-svg';
import { scaleLinear, scaleBand } from 'd3-scale';
import { group, sum } from 'd3-array';
import { format } from 'date-fns';
import Colors from '../../../../../../style/Colors';
import { DateTimeHelper } from '../../../../../../time';
import { DurationText } from '../../../../../common/DurationText';

const xAxisHeight = 30
const yAxisWidth = 80
const topPadding = 5
const rightPadding = 20

const stagesSet = [SleepStage.Wake, SleepStage.Rem, SleepStage.Light, SleepStage.Deep]
const simpleSet = [SleepStage.Asleep, SleepStage.Restless, SleepStage.Awake]

const stageSpecs: { [key: string]: { stage: SleepStage, name: string, color: string, contributeToSleep: boolean } } = {}
stageSpecs[SleepStage.Asleep] = { stage: SleepStage.Asleep, name: "Asleep", color: "#105da6", contributeToSleep: true }
stageSpecs[SleepStage.Awake] = { stage: SleepStage.Awake, name: "Awake", color: "#ff007d", contributeToSleep: false }
stageSpecs[SleepStage.Restless] = { stage: SleepStage.Restless, name: "Restless", color: "#44b0ef", contributeToSleep: true }

stageSpecs[SleepStage.Wake] = { stage: SleepStage.Wake, name: "Awake", color: "#ED4376", contributeToSleep: false }
stageSpecs[SleepStage.Rem] = { stage: SleepStage.Rem, name: "Rem", color: "#8BD0F7", contributeToSleep: true }
stageSpecs[SleepStage.Light] = { stage: SleepStage.Light, name: "Light", color: "#51A2FF", contributeToSleep: true }
stageSpecs[SleepStage.Deep] = { stage: SleepStage.Deep, name: "Deep", color: "#1662B8", contributeToSleep: true }


const styles = StyleSheet.create({
    chartContainerStyle: {
        marginTop: Sizes.horizontalPadding,
        flex: 1,
        maxHeight: 270,
        backgroundColor: "#424254",
        borderRadius: 16,
        marginLeft: Sizes.horizontalPadding,
        marginRight: Sizes.horizontalPadding,
        marginBottom: Sizes.verticalPadding,
    },
    stageLengthContainerStyle: {
        marginTop: Sizes.verticalPadding,
        marginLeft: Sizes.horizontalPadding,
        marginRight: Sizes.horizontalPadding,
        marginBottom: Sizes.verticalPadding,
    },
    stageLengthRowStyle: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios'? 1.5 : 0,
        paddingBottom: Platform.OS === 'ios'? 1.5 : 0
    },
    
    subTitleStyle: { ...commonIntraDayPanelStyles.summaryTextTitleStyle, padding: Sizes.horizontalPadding, paddingBottom: 0 },
    summaryTitleStyle: { ...commonIntraDayPanelStyles.summaryTextTitleStyle, padding: 0, marginBottom: 6},
    summaryGlobalTextStyle: {...commonIntraDayPanelStyles.summaryTextGlobalStyle, textAlign: 'left', marginBottom: 2*Sizes.horizontalPadding},
    summaryPartStyle: { flex: 1, paddingLeft: Sizes.horizontalPadding },
    summaryContainerStyle: { flexDirection: 'row', marginBottom: Sizes.horizontalPadding, marginTop: Sizes.horizontalPadding }
})

const stageNameSpacing = 16

const xTickFormat = (diffSeconds) => {

    if (diffSeconds < 0) {
        diffSeconds = 24 * 3600 + diffSeconds
    }
    if (diffSeconds === 0) {
        return "Midnight"
    } else {
        let hours = Math.floor(diffSeconds / 3600)
        let minutes = Math.floor((diffSeconds % 3600) / 60)
        const seconds = diffSeconds % 60

        if (seconds >= 30) {
            minutes++
            if (minutes === 60) {
                minutes = 0
                hours++
            }
        }

        if (hours === 12 && minutes === 0) {
            return "Noon"
        } else return format(new Date(0, 0, 0, hours, minutes), "hh:mm a").toLowerCase()
    }
}

export const SleepIntraDayPanel = () => {


    const { data } = useSelector((appState: ReduxAppState) => ({
        data: appState.explorationDataState.data as IDailySleepSummaryEntry
    }))

    if (data != null) {

        const [chartContainerWidth, setChartContainerWidth] = useState(-1)
        const [chartContainerHeight, setChartContainerHeight] = useState(-1)

        const chartArea: LayoutRectangle = {
            x: yAxisWidth,
            y: topPadding,
            width: chartContainerWidth - yAxisWidth - rightPadding,
            height: chartContainerHeight - xAxisHeight - topPadding
        }

        let stageSet: Array<SleepStage>
        switch (data.stageType) {
            case 'stages':
                stageSet = stagesSet
                break;
            case 'simple':
                stageSet = simpleSet
                break;
        }


        const fragmentsByGroup = group(data.listOfLevels, l => l.type)

        const lengthAsleep = sum(stageSet.filter(s => stageSpecs[s].contributeToSleep === true).map(stage => fragmentsByGroup.has(stage)===true ? sum(fragmentsByGroup.get(stage), e => e.lengthInSeconds) : 0))
        
        const scaleX = scaleLinear().domain([data.bedTimeDiffSeconds, data.wakeTimeDiffSeconds]).range([0, chartArea.width])

        const tickStartHour = Math.ceil(data.bedTimeDiffSeconds / 3600)
        const tickEndHour = Math.floor(data.wakeTimeDiffSeconds / 3600)
        const ticks = []
        for (let i = tickStartHour; i <= tickEndHour; i++) {
            ticks.push(i)
        }

        const scaleY = scaleBand().domain(stageSet).padding(0.4).range([0, chartArea.height])

        return <View style={commonIntraDayPanelStyles.containerStyle}>
            <Text style={styles.subTitleStyle}>Sleep Stages</Text>
            <SizeWatcher containerStyle={styles.chartContainerStyle} onSizeChange={(width, height) => { setChartContainerWidth(width); setChartContainerHeight(height) }}>
                <Svg width={chartContainerWidth} height={chartContainerHeight}>
                    <G {...chartArea}>
                        {
                            stageSet.map(stage => {
                                return <G key={stage} y={scaleY(stage)}>
                                    <SvgText fill={stageSpecs[stage].color} fontSize={Sizes.smallFontSize} textAnchor="end" alignmentBaseline="central"
                                        x={-stageNameSpacing} y={scaleY.bandwidth() * 0.5}>{stageSpecs[stage].name}</SvgText>
                                    {
                                        fragmentsByGroup.has(stage) === true && fragmentsByGroup.get(stage).map((levelElm, i) => {
                                            return <Rect
                                                key={i.toString()}
                                                x={scaleX(levelElm.startBedtimeDiff + data.bedTimeDiffSeconds)}
                                                y={0}
                                                height={scaleY.bandwidth()}
                                                fill={stageSpecs[stage].color}
                                                width={scaleX(levelElm.lengthInSeconds) - scaleX(0)}
                                            />
                                        })
                                    }
                                </G>
                            })
                        }
                    </G>
                    <G x={chartArea.x} y={chartArea.y + chartArea.height}>
                        <Line x1={0} x2={chartArea.width} y={0} stroke={'white'} strokeWidth={0.5} />

                        {
                            ticks.map(t => t * 3600).map((tick, i) => {
                                return <G key={tick.toString()} x={scaleX(tick)}>
                                    <Line x={0} y1={0} y2={-5} stroke={'white'} />
                                    {i === Math.floor(ticks.length / 2) && ticks.length > 3 &&
                                        <SvgText textAnchor="middle" y={Sizes.horizontalPadding} fill={'white'}>{xTickFormat(tick)}</SvgText>}
                                </G>
                            })
                        }

                        <SvgText textAnchor="start" y={Sizes.horizontalPadding} fill={'white'}>{xTickFormat(data.bedTimeDiffSeconds)}</SvgText>
                        <SvgText textAnchor="end" x={scaleX(data.wakeTimeDiffSeconds)} y={Sizes.horizontalPadding} fill={'white'}>{xTickFormat(data.wakeTimeDiffSeconds)}</SvgText>
                    </G>

                </Svg>
            </SizeWatcher>
            <Text style={styles.subTitleStyle}>Time Spent in Each Stage</Text>

            <View style={styles.stageLengthContainerStyle}>
                {
                    stageSet.map(stage => {
                        const length = fragmentsByGroup.has(stage) === true ? sum(fragmentsByGroup.get(stage), elm => elm.lengthInSeconds) : 0

                        return <View key={stage} style={styles.stageLengthRowStyle}>
                            <Text style={{
                                color: stageSpecs[stage].color,
                                fontSize: Sizes.smallFontSize,
                                textAlign: 'right',
                                paddingRight: stageNameSpacing,
                                width: yAxisWidth
                            }}>{stageSpecs[stage].name}</Text>

                            <View style={{
                                height: 30,
                                width: scaleX(length) - scaleX(0),
                                backgroundColor: stageSpecs[stage].color
                            }} />

                            <View style={{ marginLeft: 6 }}>
                                <Text>{Math.round(length / data.lengthInSeconds * 100)}%</Text>
                                <Text style={{ fontSize: Sizes.tinyFontSize, color: Colors.textGray }}>{DateTimeHelper.formatDuration(length, true)}</Text>
                            </View>
                        </View>
                    })
                }
            </View>

            <View style={styles.summaryContainerStyle}>
                <View style={styles.summaryPartStyle}>
                    <Text style={styles.summaryTitleStyle}>Total Hours Spent</Text>
                    <DurationText durationMinutes={Math.round(data.lengthInSeconds/60)} 
                        containerTextStyle={styles.summaryGlobalTextStyle} 
                        unitStyle={commonIntraDayPanelStyles.summaryTextUnitStyle}/>
                </View>
                <View style={styles.summaryPartStyle}>
                    <Text style={styles.summaryTitleStyle}>Hours Asleep</Text>
                    <DurationText durationMinutes={Math.round(lengthAsleep/60)} 
                        containerTextStyle={styles.summaryGlobalTextStyle} 
                        unitStyle={commonIntraDayPanelStyles.summaryTextUnitStyle}/>
                </View>
            </View>

        </View>
    } else return <></>
}