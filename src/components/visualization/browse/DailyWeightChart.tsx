import React from 'react';
import Svg, { G, Circle, Path, Line, Rect } from 'react-native-svg';
import { CommonBrowsingChartStyles, ChartPropsBase, getChartElementColor } from './common';
import { AxisSvg } from '@components/visualization/axis';
import { Padding } from '@components/visualization/types';
import { DateTimeHelper } from '@utils/time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '@style/Colors';
import { IWeightIntraDayLogEntry } from '@core/exploration/data/types';
import { MeasureUnitType, DataSourceType } from '@measure/DataSourceSpec';
import unitConvert from 'convert-units';
import { noop, coverValueInRange } from '@utils/utils';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '@state/types';
import { DataServiceManager } from '@measure/DataServiceManager';
import { getScaleStepLeft } from '../d3-utils';

interface Props extends ChartPropsBase<{
    trend: Array<{ numberedDate: number, value: number }>,
    logs: Array<IWeightIntraDayLogEntry>
}> {
    measureUnitType: MeasureUnitType,
    futureNearestLog: IWeightIntraDayLogEntry,
    pastNearestLog: IWeightIntraDayLogEntry,

}

export const DailyWeightChart = React.memo((prop: Props) => {


    const { shouldHighlightElements, highlightReference } = CommonBrowsingChartStyles.makeHighlightInformation(prop, DataSourceType.Weight)

    const serviceKey = useSelector((appState: ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const convert = prop.measureUnitType === MeasureUnitType.Metric ? noop : (n: number) => unitConvert(n).from('kg').to('lb')

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(undefined, prop.dateRange[0], prop.dateRange[1], chartArea.width)

    const today = DateTimeHelper.toNumberedDateFromDate(getToday())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const trendMin = prop.data.trend.length > 0 ? d3Array.min(prop.data.trend, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const trendMax = prop.data.trend.length > 0 ? d3Array.max(prop.data.trend, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const logMin = prop.data.logs.length > 0 ? d3Array.min(prop.data.logs, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const logMax = prop.data.logs.length > 0 ? d3Array.max(prop.data.logs, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const preferredMin = prop.preferredValueRange[0] != null ? convert(prop.preferredValueRange[0]) : null
    const preferredMax = prop.preferredValueRange[1] != null ? convert(prop.preferredValueRange[1]) : null
    const weightDomain = coverValueInRange([
        Math.floor(((trendMin === Number.MAX_SAFE_INTEGER && logMin === Number.MAX_SAFE_INTEGER && preferredMin == null) ? 0 : Math.min(trendMin, logMin, preferredMin || Number.MAX_SAFE_INTEGER)) - 1),
        Math.ceil(((trendMax === Number.MIN_SAFE_INTEGER && logMax === Number.MIN_SAFE_INTEGER && preferredMax == null) ? 0 : Math.max(trendMax, logMax, preferredMax || Number.MIN_SAFE_INTEGER)) + 1),
    ], convert(highlightReference))

    const scaleY = scaleLinear()
        .domain(weightDomain)
        .range([chartArea.height, 0])
        .nice()

    const trendLine = d3Shape.line<{ value: number, numberedDate: number }>()
        .x((d) => scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(convert(d.value)))


    const veryLastLog = prop.futureNearestLog == null ? (prop.data.logs.length > 0 ? prop.data.logs[prop.data.logs.length - 1] : prop.pastNearestLog) : null

    return <Svg pointerEvents="none" width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                prop.highlightFilter && prop.highlightedDays && Object.keys(prop.highlightedDays).map(date => {
                    return <Rect key={date} fill={Colors.highlightElementBackground} opacity={0.2} x={getScaleStepLeft(scaleX, Number.parseInt(date))} width={scaleX.step()} height={chartArea.height} />
                })
            }
            {
                prop.data.logs.map(d => {
                    return <Circle key={d.numberedDate}
                        x={scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5}
                        y={scaleY(convert(d.value))}
                        r={Math.min(scaleX.bandwidth(), 8) / 2}
                        strokeWidth={2}
                        fill={Colors.WHITE}
                        stroke={getChartElementColor(shouldHighlightElements, prop.highlightedDays? prop.highlightedDays[d.numberedDate] == true : false, today === d.numberedDate)}
                        opacity={0.62}
                    />
                })
            }
            {
                <Path d={trendLine(prop.data.trend)!}
                    strokeWidth={2.5}
                    fill="transparent"
                    stroke={Colors.chartElementDefault}
                    opacity={1}
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
            {
                highlightReference != null ? <Line x1={0} x2={chartArea.width} y={scaleY(convert(highlightReference))} stroke={Colors.highlightElementColor} strokeWidth={2} /> : null
            }
        </G>
    </Svg>

})