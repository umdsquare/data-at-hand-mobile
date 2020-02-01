import React, { useState } from 'react'
import { View, Text, LayoutRectangle, StyleSheet } from "react-native"
import { StyleTemplates } from '../../../../../../style/Styles'
import { useSelector } from 'react-redux'
import { ReduxAppState } from '../../../../../../state/types'
import { scaleLinear } from 'd3-scale'
import { StepCountIntraDayData } from '../../../../../../core/exploration/data/types'
import { max, sum } from 'd3-array'
import { SizeWatcher } from '../../../../../visualization/SizeWatcher'
import Svg, { G, Rect } from 'react-native-svg'
import { Sizes } from '../../../../../../style/Sizes'
import Colors from '../../../../../../style/Colors'
import { AxisSvg } from '../../../../../visualization/axis'
import { Padding } from '../../../../../visualization/types'
import commaNumber from 'comma-number';
import { pad } from '../../../../../../time'

const xAxisHeight = 50
const yAxisWidth = 60
const topPadding = 10
const rightPadding = 10
const barPadding = 1

const styles = StyleSheet.create({
    containerStyle: { ...StyleTemplates.fillFlex, backgroundColor: 'white' },
    chartContainerStyle: { aspectRatio: 1, marginTop: Sizes.horizontalPadding },
    summaryTextGlobalStyle: {textAlign:'center', fontSize: Sizes.BigFontSize },
    summaryTextTitleStyle: { marginRight: 20, fontSize: Sizes.normalFontSize, color: Colors.textGray },
    summaryTextUnitStyle: { fontSize: Sizes.smallFontSize, color: Colors.textColorLight }

})

const yTickLabelStyle = { fontSize: Sizes.smallFontSize }
const xTickLabelStyle = { fontSize: Sizes.tinyFontSize }

export const StepIntraDayPanel = (props: {

}) => {
    const { data } = useSelector((appState: ReduxAppState) => ({
        data: appState.explorationDataState.data as StepCountIntraDayData
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
        const scaleX = scaleLinear().domain([0, 24]).range([0, chartArea.width])
        const scaleY = scaleLinear().domain([0, max(data.hourlySteps, d => d.value)]).range([chartArea.height, 0])

        return <View style={styles.containerStyle}>
            <SizeWatcher containerStyle={styles.chartContainerStyle} onSizeChange={(width, height) => { setChartContainerWidth(width); setChartContainerHeight(height) }}>
                <Svg width={chartContainerWidth} height={chartContainerHeight}>
                    <G {...chartArea}>
                        {
                            data.hourlySteps.map(stepEntry => {
                                return <Rect key={stepEntry.id} fill={Colors.chartElementDefault}
                                    x={scaleX(stepEntry.hourOfDay) + barPadding}
                                    y={scaleY(stepEntry.value)}
                                    width={scaleX(1) - scaleX(0) - barPadding * 2}
                                    height={chartArea.height - scaleY(stepEntry.value)} />
                            })
                        }
                    </G>

                    <AxisSvg key="yAxis"
                        tickMargin={0}
                        ticks={scaleY.ticks()}
                        tickFormat={commaNumber}
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

            <View style={StyleTemplates.contentVerticalCenteredContainer}>
                    <Text style={styles.summaryTextGlobalStyle}>

                        <Text style={styles.summaryTextTitleStyle}>Total    </Text>
                        <Text>{commaNumber(sum(data.hourlySteps, d => d.value))}</Text>
                        <Text style={styles.summaryTextUnitStyle}> steps</Text>
                    </Text>
            </View>
        </View>
    } return <></>

}