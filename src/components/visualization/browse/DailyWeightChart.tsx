import React, { useContext, useMemo } from 'react';
import Svg, { G, Circle, Path, Line, Rect } from 'react-native-svg';
import { CommonBrowsingChartStyles, ChartPropsBase, getChartElementColor, DateRangeScaleContext } from './common';
import { AxisSvg } from '@components/visualization/axis';
import { Padding } from '@components/visualization/types';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '@style/Colors';
import { IWeightIntraDayLogEntry } from '@core/exploration/data/types';
import { MeasureUnitType, DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import unitConvert from 'convert-units';
import { noop, coverValueInRange } from '@data-at-hand/core/utils';
import { getScaleStepLeft } from '../d3-utils';
import { TodayContext } from '@components/pages/exploration/contexts';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '@state/types';
import { GoalValueIndicator } from './GoalValueIndicator';
import { BandScaleChartTouchHandler } from './BandScaleChartTouchHandler';
import { PointFallbackCircle } from './PointFallbackCircle';

const weightTickFormat = (weight: number) => weight.toFixed(1)

interface Props extends ChartPropsBase<{
    trend: Array<{ numberedDate: number, value: number }>,
    logs: Array<IWeightIntraDayLogEntry>
}> {
    futureNearestLog: IWeightIntraDayLogEntry,
    pastNearestLog: IWeightIntraDayLogEntry,

}

export const DailyWeightChart = React.memo((prop: Props) => {


    const { shouldHighlightElements, highlightReference } = CommonBrowsingChartStyles.makeHighlightInformation(prop, DataSourceType.Weight)

    const today = useContext(TodayContext)
    const scaleX = useContext(DateRangeScaleContext) || CommonBrowsingChartStyles.makeDateScale(undefined, prop.dateRange[0], prop.dateRange[1])

    const measureUnitType = useSelector((appContext: ReduxAppState) => appContext.settingsState.unit)

    const convert = useMemo(() => measureUnitType === MeasureUnitType.Metric ? noop : (n: number) => (n != null ? unitConvert(n).from('kg').to('lb') : null),
        [measureUnitType])

    const chartArea = CommonBrowsingChartStyles.CHART_AREA

    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const trendMin = prop.data.trend.length > 0 ? d3Array.min(prop.data.trend, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const trendMax = prop.data.trend.length > 0 ? d3Array.max(prop.data.trend, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const logMin = prop.data.logs.length > 0 ? d3Array.min(prop.data.logs, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const logMax = prop.data.logs.length > 0 ? d3Array.max(prop.data.logs, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const preferredMin = prop.preferredValueRange[0] != null ? convert(prop.preferredValueRange[0]) : null
    const preferredMax = prop.preferredValueRange[1] != null ? convert(prop.preferredValueRange[1]) : null

    const weightDomain = coverValueInRange(coverValueInRange([
        Math.floor(((trendMin === Number.MAX_SAFE_INTEGER && logMin === Number.MAX_SAFE_INTEGER && preferredMin == null) ? 0 : Math.min(trendMin, logMin, preferredMin || Number.MAX_SAFE_INTEGER)) - 1),
        Math.ceil(((trendMax === Number.MIN_SAFE_INTEGER && logMax === Number.MIN_SAFE_INTEGER && preferredMax == null) ? 0 : Math.max(trendMax, logMax, preferredMax || Number.MIN_SAFE_INTEGER)) + 1),
    ], convert(highlightReference)), convert(prop.goalValue))

    const scaleY = scaleLinear()
        .domain(weightDomain)
        .range([chartArea.height, 0])
        .nice()

    const trendLine = d3Shape.line<{ value: number, numberedDate: number }>()
        .x((d) => scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(convert(d.value)))


    const veryLastLog = prop.futureNearestLog == null ? (prop.data.logs.length > 0 ? prop.data.logs[prop.data.logs.length - 1] : prop.pastNearestLog) : null

    return <BandScaleChartTouchHandler
        chartContainerWidth={CommonBrowsingChartStyles.CHART_WIDTH}
        chartContainerHeight={CommonBrowsingChartStyles.CHART_HEIGHT}
        chartArea={chartArea}
        scaleX={scaleX}
        dataSource={DataSourceType.Weight}
        disableIntraDayLink={true}
        getValueOfDate={(date) => prop.data.trend.find(d => d.numberedDate === date)?.value}
        highlightedDays={prop.dataDrivenQuery != null ? prop.highlightedDays : undefined}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                prop.dataDrivenQuery && prop.highlightedDays && Object.keys(prop.highlightedDays).map(date => {
                    if (date != null && date != "null") {
                        return <Rect key={date} fill={Colors.highlightElementBackground} opacity={0.2} x={getScaleStepLeft(scaleX, Number.parseInt(date))} width={scaleX.step()} height={chartArea.height} />
                    } else return null
                })
            }
            {
                prop.data.logs.map(d => {
                    return <PointFallbackCircle key={d.numberedDate + "" + d.secondsOfDay}
                        x={scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5}
                        y={scaleY(convert(d.value))}
                        r={Math.min(scaleX.bandwidth(), 8) / 2}
                        strokeWidth={2}
                        fill={Colors.WHITE}
                        stroke={getChartElementColor(shouldHighlightElements, prop.highlightedDays ? prop.highlightedDays[d.numberedDate] == true : false, today === d.numberedDate)}
                        opacity={0.62}
                        thresholdRadius={1}
                    />
                })
            }
            {
                <Path d={trendLine(prop.data.trend)!}
                    strokeWidth={2.5}
                    fill="transparent"
                    stroke={Colors.chartElementDefault}
                    opacity={0.8}
                />
            }
            {
                veryLastLog && <Line
                    x1={scaleX(Math.max(veryLastLog.numberedDate, scaleX.domain()[0]))}
                    x2={chartArea.width}
                    y={scaleY(convert(veryLastLog.value))}
                    stroke={Colors.today}
                    strokeWidth={2}
                />
            }

            <GoalValueIndicator yScale={scaleY} goal={prop.goalValue} lineLength={chartArea.width}
                labelAreaWidth={CommonBrowsingChartStyles.yAxisWidth} valueConverter={convert} valueFormatter={weightTickFormat} />
            {
                highlightReference != null ? <Line x1={0} x2={chartArea.width} y={scaleY(convert(highlightReference))} stroke={Colors.highlightElementColor} strokeWidth={2} /> : null
            }
        </G>
    </BandScaleChartTouchHandler>

})