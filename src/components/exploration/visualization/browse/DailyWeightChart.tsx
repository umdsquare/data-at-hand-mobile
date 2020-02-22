import React from 'react';
import Svg, { G, Circle, Path, Line } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './common';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '../../../../style/Colors';
import { IIntraDayLogEntry, IWeightIntraDayLogEntry } from '../../../../core/exploration/data/types';
import { MeasureUnitType } from '../../../../measure/DataSourceSpec';
import unitConvert from 'convert-units';
import { noop } from '../../../../utils';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';
import { DataServiceManager } from '../../../../system/DataServiceManager';


export const DailyWeightChart = (prop: {
    dateRange: number[],
    data: {
        trend: Array<{ numberedDate: number, value: number }>,
        logs: Array<IWeightIntraDayLogEntry>
    },
    preferredValueRange: number[],
    futureNearestLog: IWeightIntraDayLogEntry,
    pastNearestLog: IWeightIntraDayLogEntry,
    containerWidth: number,
    containerHeight: number,
    measureUnitType: MeasureUnitType
}) => {

    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const convert = prop.measureUnitType === MeasureUnitType.Metric ? noop : (n) => unitConvert(n).from('kg').to('lb')

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(null, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.width])


    const today = DateTimeHelper.toNumberedDateFromDate(getToday())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const trendMin = prop.data.trend.length > 0 ? d3Array.min(prop.data.trend, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const trendMax = prop.data.trend.length > 0 ? d3Array.max(prop.data.trend, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const logMin = prop.data.logs.length > 0 ? d3Array.min(prop.data.logs, d => convert(d.value)) : Number.MAX_SAFE_INTEGER
    const logMax = prop.data.logs.length > 0 ? d3Array.max(prop.data.logs, d => convert(d.value)) : Number.MIN_SAFE_INTEGER

    const preferredMin = prop.preferredValueRange[0] != null ? convert(prop.preferredValueRange[0]) : null
    const preferredMax = prop.preferredValueRange[1] != null ? convert(prop.preferredValueRange[1]) : null
    const weightDomain = [
        Math.floor(((trendMin === Number.MAX_SAFE_INTEGER && logMin === Number.MAX_SAFE_INTEGER && preferredMin == null) ? 0 : Math.min(trendMin, logMin, preferredMin || Number.MAX_SAFE_INTEGER)) - 1),
        Math.ceil(((trendMax === Number.MIN_SAFE_INTEGER && logMax === Number.MIN_SAFE_INTEGER && preferredMax == null) ? 0 : Math.max(trendMax, logMax, preferredMax || Number.MIN_SAFE_INTEGER)) + 1),
    ]

    const scaleY = scaleLinear()
        .domain(weightDomain)
        .range([chartArea.height, 0])
        .nice()

    const trendLine = d3Shape.line<{ value: number, numberedDate: number }>()
        .x((d) => scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(convert(d.value)))


    const veryLastLog = prop.futureNearestLog == null ? (prop.data.logs.length > 0 ? prop.data.logs[prop.data.logs.length - 1] : prop.pastNearestLog) : null

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                prop.data.logs.map(d => {
                    return <Circle key={d.numberedDate}
                        x={scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5}
                        y={scaleY(convert(d.value))}
                        r={Math.min(scaleX.bandwidth(), 8) / 2}
                        strokeWidth={2}
                        fill='white'
                        stroke={today === d.numberedDate ? Colors.today : Colors.chartElementDefault}
                        opacity={0.62}
                    />
                })
            }
            {
                <Path d={trendLine(prop.data.trend)}
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
        </G>
    </Svg>

}