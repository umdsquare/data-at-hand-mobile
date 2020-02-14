import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../../../state/types';
import { StepCountIntraDayData, HeartRateIntraDayData, IIntraDayHeartRatePoint, HeartRateZone } from '../../../../../../core/exploration/data/types';
import { View, StyleSheet, LayoutRectangle, Text } from 'react-native';
import { StyleTemplates } from '../../../../../../style/Styles';
import { Sizes } from '../../../../../../style/Sizes';
import Colors from '../../../../../../style/Colors';
import { scaleLinear } from 'd3-scale';
import { max, min, sum } from 'd3-array';
import { SizeWatcher } from '../../../../../visualization/SizeWatcher';
import Svg, { G, Rect, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { AxisSvg } from '../../../../../visualization/axis';
import { Padding } from '../../../../../visualization/types';
import { pad, DateTimeHelper } from '../../../../../../time';
import * as d3Shape from 'd3-shape';
import { commonIntraDayPanelStyles, NoDataFallbackView } from './common';

const xAxisHeight = 50
const yAxisWidth = 50
const topPadding = 10
const rightPadding = 24

const styles = StyleSheet.create({
    containerStyle: {
        ...commonIntraDayPanelStyles.containerStyle,
        paddingBottom: Sizes.horizontalPadding * 2
    },
    chartContainerStyle: { flex: 1, marginTop: Sizes.horizontalPadding, marginBottom: 50 },

    zoneChartContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 25,
        marginLeft: Sizes.horizontalPadding * 2,
        marginRight: Sizes.horizontalPadding * 2,
        marginBottom: 6
    },

    zoneChartTitleStyle: { width: 80, color: Colors.textColorLight },

    zoneChartValueStyle: { paddingLeft: 12 }

})

const yTickLabelStyle = { fontSize: Sizes.smallFontSize }
const xTickLabelStyle = { fontSize: Sizes.tinyFontSize }

const heartRateZoneSpecs: Array<{ type: HeartRateZone, color: string, name: string }> = [
    {
        type: HeartRateZone.Peak,
        name: "Peak",
        color: "#FF5C2B"
    }, {
        type: HeartRateZone.Cardio,
        name: "Cardio",
        color: "#FF952B"
    },
    {
        type: HeartRateZone.FatBurn,
        name: 'Fat Burn',
        color: "#FFCE2B"
    },]


export const HeartRateIntraDayPanel = () => {
    const { data } = useSelector((appState: ReduxAppState) => ({
        data: appState.explorationDataState.data as HeartRateIntraDayData
    }))

    const [chartContainerWidth, setChartContainerWidth] = useState(-1)
    const [chartContainerHeight, setChartContainerHeight] = useState(-1)
    const [maxZoneBarWidth, setMaxZoneBarWidth] = useState(0)

    console.log("heart rate data:", data)

    if (data != null && data.points.length > 0) {

        const chartArea: LayoutRectangle = {
            x: yAxisWidth,
            y: topPadding,
            width: chartContainerWidth - yAxisWidth - rightPadding,
            height: chartContainerHeight - xAxisHeight - topPadding
        }
        const scaleX = scaleLinear().domain([0, 24]).range([0, chartArea.width])
        const scaleY = scaleLinear().domain([min(data.points, d => d.value), max(data.points, d => d.value)])
            .range([chartArea.height, 0]).nice()


        const line = d3Shape.line<IIntraDayHeartRatePoint>()
            .x((d) => scaleX(d.secondOfDay / 3600))
            .y((d) => scaleY(d.value))

        const exerciseZones = data.zones.filter(zone => zone.name != HeartRateZone.OutOfRange)
        const exerciseZoneMinutes = sum(exerciseZones, zone => zone.minutes)
        const exerciseHrs = Math.floor(exerciseZoneMinutes / 60)
        const exerciseMins = exerciseZoneMinutes % 60
        const exerciseValue = [{ type: "value", value: exerciseMins }, { type: 'unit', value: " min" }] as any
        if (exerciseHrs > 0) {
            exerciseValue.unshift({ type: 'unit', value: ' hr  ' })
            exerciseValue.unshift({ type: 'value', value: exerciseHrs })
        }

        const maxZoneLength = max(exerciseZones, zone => zone.minutes)

        return <View style={styles.containerStyle}>
            <SizeWatcher containerStyle={styles.chartContainerStyle} onSizeChange={(width, height) => { setChartContainerWidth(width); setChartContainerHeight(height) }}>
                <Svg width={chartContainerWidth} height={chartContainerHeight}>
                    <G {...chartArea}>
                        <Path d={line(data.points)} fill="transparent" stroke={Colors.accent} strokeWidth={1} />
                        <Line x1={0} x2={chartArea.width} y={scaleY(data.restingHeartRate)} stroke={Colors.chartAvgLineColor} strokeWidth={2} strokeDasharray={"4"} />
                        <SvgText y={scaleY(data.restingHeartRate) - 8} fontSize={Sizes.tinyFontSize} fontWeight={"bold"}>Resting HR</SvgText>
                    </G>

                    <AxisSvg key="yAxis"
                        tickMargin={0}
                        ticks={scaleY.ticks()}
                        overrideTickLabelStyle={yTickLabelStyle}
                        chartArea={chartArea} scale={scaleY} position={Padding.Left} />
                    <AxisSvg key="xAxis"
                        tickMargin={0}
                        ticks={scaleX.ticks()}
                        tickFormat={(v) => v === 12 ? 'Noon' : pad(v, 2) + ":00"}
                        chartArea={chartArea} scale={scaleX} position={Padding.Bottom}
                        overrideTickLabelStyle={xTickLabelStyle}
                    />

                </Svg>
            </SizeWatcher>

            <SummaryTableRow title="Resting Heart Rate" value={data.restingHeartRate ? [{ type: "value", value: data.restingHeartRate }, { type: 'unit', value: ' bpm', }] : [{ type: "unit", value: "Cannot calculate yet." }]} />
            <SummaryTableRow title="Exercise Zones" value={exerciseValue} />

            <View style={{ margin: Sizes.horizontalPadding, marginTop: 0, height: 1, backgroundColor: Colors.chartLightText }}></View>

            {
                heartRateZoneSpecs.map(spec => {
                    const zoneInfo = data.zones.find(z => z.name === spec.type)

                    const isMax = zoneInfo.minutes === maxZoneLength

                    return <View key={spec.type} style={styles.zoneChartContainerStyle}>
                        <Text style={styles.zoneChartTitleStyle}>{spec.name}</Text>
                        <SizeWatcher containerStyle={{ 
                            flex: isMax===true ? 1 : null, 
                            width: isMax===false ? Math.max(1, zoneInfo.minutes/maxZoneLength * maxZoneBarWidth) : null,
                            backgroundColor: spec.color, alignSelf: 'stretch' }}
                            onSizeChange={(width, height) => {
                                if(isMax===true){
                                    setMaxZoneBarWidth(width)
                                }
                             }} />
                        <Text style={styles.zoneChartValueStyle}>{zoneInfo ? DateTimeHelper.formatDuration(zoneInfo.minutes * 60, true) : 0}</Text>
                    </View>
                })
            }

        </View>

    } else return <NoDataFallbackView/>
}

const SummaryTableRow = (prop: { title: string, value: Array<{ type: "unit" | "value", value: string | number }> }) => {
    return <View style={commonIntraDayPanelStyles.summaryRowContainerStyle}>
        <Text style={{ ...commonIntraDayPanelStyles.summaryTextTitleStyle, flex: 1 }}>{prop.title}</Text>
        <Text style={{
            ...commonIntraDayPanelStyles.summaryTextGlobalStyle,
            flex: 1, textAlign: 'left'
        }}>
            {
                prop.value.map((entity, i) => <Text key={i.toString()}
                    style={entity.type === 'unit' ? commonIntraDayPanelStyles.summaryTextUnitStyle : null}>{entity.value}</Text>)
            }
        </Text>
    </View>
}
