import React, { useMemo } from 'react';
import { ChartProps } from '../types';
import Svg, { G, Rect, Circle, Line, Path } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './common';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '../../../../style/Colors';
import { GroupWithTouchInteraction } from './GroupWithTouchInteraction';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';
import { DataServiceManager } from '../../../../system/DataServiceManager';


export const DailyHeartRateChart = React.memo((prop: ChartProps) => {

    const shouldHighlightElements = useMemo(()=> prop.highlightFilter && prop.highlightFilter.dataSource === prop.dataSource && prop.highlightedDays, [
        prop.highlightFilter,
        prop.dataSource,
        prop.highlightedDays
    ])

    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(undefined, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.width])


    const today = DateTimeHelper.toNumberedDateFromDate(getToday())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const valueMin = Math.min(d3Array.min(prop.data, d => d.value)!, prop.preferredValueRange[0] || Number.MAX_SAFE_INTEGER)
    const valueMax = Math.max(d3Array.max(prop.data, d => d.value)!, prop.preferredValueRange[1] || Number.MIN_SAFE_INTEGER)

    const scaleY = scaleLinear()
        .domain([valueMin - 1, valueMax + 1])
        .range([chartArea.height, 0])
        .nice()

    const line = d3Shape.line<{value: number, numberedDate: number}>()
        .x((d) => scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(d.value))
        .curve(d3Shape.curveCardinal)

    const avg = d3Array.mean(prop.data, d => d.value)!

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <GroupWithTouchInteraction chartArea={chartArea} scaleX={scaleX} dataSource={prop.dataSource} getValueOfDate={(date) => prop.data.find(d => d.numberedDate === date)!.value} highlightedDays={prop.highlightedDays}>
            {
                <Path d={line(prop.data)!}
                    strokeWidth={2.5}
                    fill="transparent"
                    stroke={Colors.chartElementDefault}
                    opacity={0.3}
                />
            }
            {
                prop.data.map(d => {
                    return <Circle key={d.numberedDate}
                        x={scaleX(d.numberedDate)! + scaleX.bandwidth() * 0.5}
                        y={scaleY(d.value)}
                        r={Math.min(scaleX.bandwidth(), 8)/2 }
                        strokeWidth={2}
                        fill='white'
                        stroke={today === d.numberedDate ? Colors.today : (shouldHighlightElements && prop.highlightedDays[d.numberedDate] == true? Colors.highlightElementColor : Colors.chartElementDefault)}
                        opacity={0.62}
                    />
                })
            }
            {
                Number.isNaN(avg) === false && <Line x1={0} x2={chartArea.width} y={scaleY(avg)} stroke={Colors.chartAvgLineColor} strokeWidth={1} strokeDasharray={"2"}/>
            }
        </GroupWithTouchInteraction>
    </Svg>

})