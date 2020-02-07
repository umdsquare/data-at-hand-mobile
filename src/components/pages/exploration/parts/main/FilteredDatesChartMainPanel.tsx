import React from 'react';
import { View, LayoutRectangle } from 'react-native';
import { StyleTemplates } from '../../../../../style/Styles';
import { SizeWatcher } from '../../../../visualization/SizeWatcher';
import Svg, { G, Line, Text as SvgText, Rect, Circle } from 'react-native-svg';
import { Dispatch } from 'redux';
import { ReduxAppState } from '../../../../../state/types';
import { explorationInfoHelper } from '../../../../../core/exploration/ExplorationInfoHelper';
import { ParameterType } from '../../../../../core/exploration/types';
import { connect } from 'react-redux';
import { DataSourceType, MeasureUnitType } from '../../../../../measure/DataSourceSpec';
import { FilteredDailyValues } from '../../../../../core/exploration/data/types';
import { scaleBand, scaleLinear, ScaleBand } from 'd3-scale';
import { noop } from '../../../../../utils';
import { min, max } from 'd3-array';
import unitConvert from 'convert-units';
import Colors from '../../../../../style/Colors';
import { Sizes } from '../../../../../style/Sizes';
import { format } from 'date-fns';
import { DateTimeHelper } from '../../../../../time';
import { AxisSvg } from '../../../../visualization/axis';
import { Padding } from '../../../../visualization/types';
import { GroupWithTouchInteraction } from '../../../../exploration/visualization/browse/GroupWithTouchInteraction';
import { timeTickFormat } from '../../../../exploration/visualization/compare/common';
import commaNumber from 'comma-number';

const xAxisHeight = 160
const yAxisWidth = 60
const topPadding = 20
const rightPadding = 20

interface Props {
    source?: DataSourceType,
    data?: FilteredDailyValues,
    measureUnitType?: MeasureUnitType
}

interface State {
    containerWidth: number,
    containerHeight: number
}

class FilteredDatesChartMainPanel extends React.Component<Props, State> {

    private onSizeChange = (width, height) => {
        this.setState({
            ...this.state,
            containerWidth: width,
            containerHeight: height
        })
    }

    constructor(props) {
        super(props)

        this.state = {
            containerWidth: 0,
            containerHeight: 0,
        }
    }

    private getXSize = (date: number, scaleX: ScaleBand<number>) => {
        const size = Math.min(35, scaleX.bandwidth())
        const x = scaleX(date) + scaleX.bandwidth() * .5 - size * .5

        return {
            x,
            size
        }
    }

    render() {
        if (this.props.data) {

            const chartArea: LayoutRectangle = {
                x: yAxisWidth,
                y: topPadding,
                width: this.state.containerWidth - yAxisWidth - rightPadding,
                height: this.state.containerHeight - xAxisHeight - topPadding
            }

            let ticks: Array<number>
            let tickFormat = noop
            let converter = noop

            switch (this.props.source) {
                case DataSourceType.StepCount:
                    tickFormat = commaNumber
                    break;
                case DataSourceType.Weight:
                    converter = this.props.measureUnitType === MeasureUnitType.Metric ? noop : (n) => unitConvert(n).from('kg').to('lb')
                    break;
                case DataSourceType.SleepRange:
                    tickFormat = timeTickFormat
                    break;
                case DataSourceType.HoursSlept:
                    tickFormat = (n) => DateTimeHelper.formatDuration(n, true)
            }

            const nonNullDataset = this.props.data.data.filter(d => d.value != null)

            const scaleX = scaleBand<number>().padding(0.1).domain(this.props.data.data.map(d => d.numberedDate)).range([0, chartArea.width])
            const scaleY = scaleLinear()
                .domain([this.props.data.type === 'length' ? 0 : converter(min(nonNullDataset, d => d.value)), converter(max(nonNullDataset, d => d.value))])
                .range([chartArea.height, 0]).nice()

            if (this.props.data.type === 'range') {
                scaleY.domain([
                    converter(Math.min(min(nonNullDataset, d => d.value), min(nonNullDataset, d => d.value2))),
                    converter(Math.max(max(nonNullDataset, d => d.value), max(nonNullDataset, d => d.value2))),
                ]).range([0, chartArea.height])
            }

            if (this.props.source === DataSourceType.HoursSlept || this.props.source === DataSourceType.SleepRange) {
                const niceScale = scaleLinear().domain(scaleY.domain().map(t => t / 3600)).nice()
                const niceDomain = niceScale.domain().map(d => d * 3600)
                scaleY.domain(niceDomain)
                ticks = niceScale.ticks().map(t => t * 3600)
            }

            const adjustedFontSize = Math.max(Sizes.tinyFontSize, Math.min(Sizes.smallFontSize, scaleX.bandwidth()))
            const divider = scaleX.bandwidth() < Sizes.smallFontSize ? Math.ceil(this.props.data.data.length / 25) : 1

            return <SizeWatcher containerStyle={StyleTemplates.fillFlex} onSizeChange={this.onSizeChange}>
                <Svg width={this.state.containerWidth} height={this.state.containerHeight}>
                    <G x={chartArea.x} y={chartArea.y + chartArea.height}>
                        <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.textColorDark} strokeWidth={0.5} />
                        {
                            scaleX.domain().map((date, i) => {
                                if (i % divider === 0) {
                                    return <G
                                        key={date}
                                        y={12}
                                        x={scaleX(date) + scaleX.bandwidth() * .5}>

                                        {
                                            divider > 1 && <Line
                                                x={0}
                                                y1={-11}
                                                y2={-5}
                                                stroke={Colors.chartLightText}
                                                strokeWidth={1}
                                            />
                                        }

                                        <SvgText
                                            textAnchor={"end"}
                                            alignmentBaseline="hanging"
                                            fontSize={adjustedFontSize}
                                            fill={Colors.textColorLight}
                                            transform={"rotate(-90)translate(0," + -(adjustedFontSize / 2) + ")"}
                                        >{format(DateTimeHelper.toDate(date), "MMM dd, yyyy")}</SvgText></G>
                                }
                            })
                        }
                    </G>

                    <AxisSvg position={Padding.Left} scale={scaleY} ticks={ticks || scaleY.ticks()} tickFormat={tickFormat} tickMargin={0} chartArea={chartArea} />

                    <GroupWithTouchInteraction chartArea={chartArea} scaleX={scaleX} dataSource={this.props.source}>
                        {
                            nonNullDataset.map(datum => {
                                const sizeInfo = this.getXSize(datum.numberedDate, scaleX)

                                switch (this.props.data.type) {
                                    case "length":
                                        return <Rect key={datum.numberedDate}
                                            x={sizeInfo.x}
                                            y={scaleY(converter(datum.value))}
                                            fill={Colors.chartElementDefault}
                                            width={sizeInfo.size}
                                            height={scaleY(converter(scaleY.domain()[0])) - scaleY(converter(datum.value))} />
                                    case "point":
                                        return <Circle
                                            key={datum.numberedDate}
                                            x={scaleX(datum.numberedDate) + (scaleX.bandwidth() * 0.5)}
                                            y={scaleY(converter(datum.value))}
                                            fill="white"
                                            stroke={Colors.chartElementDefault}
                                            strokeWidth={2.5}
                                            r={Math.min(scaleX.bandwidth(), 6)}
                                        />
                                    case "range":
                                        return <Rect key={datum.numberedDate}
                                            x={sizeInfo.x}
                                            y={scaleY(converter(datum.value))}
                                            fill={Colors.chartElementDefault}
                                            width={sizeInfo.size}
                                            height={scaleY(converter(datum.value2)) - scaleY(converter(datum.value))}
                                        />
                                }
                            })
                        }
                    </GroupWithTouchInteraction>
                </Svg>
            </SizeWatcher>
        } else return <></>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        source: explorationInfoHelper.getParameterValue(appState.explorationDataState.info, ParameterType.DataSource),
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(FilteredDatesChartMainPanel)

export { connected as FilteredDatesChartMainPanel }