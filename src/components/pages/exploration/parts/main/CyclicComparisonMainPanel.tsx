import React from 'react';
import { StyleSheet } from 'react-native';
import { StyleTemplates } from '@style/Styles';
import { GroupedData, GroupedRangeData } from '@core/exploration/data/types';
import { Dispatch } from 'redux';
import { ReduxAppState, ActionTypeBase } from '@state/types';
import { DataSourceType, MeasureUnitType } from '@data-at-hand/core/measure/DataSourceSpec';
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper';
import { ParameterType } from '@data-at-hand/core/exploration/ExplorationInfo';
import { connect } from 'react-redux';
import { SingleValueCyclicChart } from '@components/visualization/compare/SingleValueCyclicChart';
import commaNumber from 'comma-number';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { scaleLinear } from 'd3-scale';
import convertUnit from 'convert-units';
import { RangeValueCyclicChart } from '@components/visualization/compare/RangeValueCyclicChart';
import { timeTickFormat } from '@components/visualization/compare/common';
import { CyclicTimeFrame } from '@data-at-hand/core/exploration/CyclicTimeFrame';
import { HorizontalPullToActionContainer } from '@components/common/HorizontalPullToActionContainer';
import { shiftAllRanges, InteractionType } from '@state/exploration/interaction/actions';
import Colors from '@style/Colors';

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fillFlex,
        backgroundColor: Colors.WHITE
    }
})

interface Props {
    data?: GroupedData | GroupedRangeData,
    source?: DataSourceType,
    cycleType?: CyclicTimeFrame,
    measureUnitType?: MeasureUnitType,
    dispatchAction?: (action: ActionTypeBase) => void
}

class CyclicComparisonMainPanel extends React.PureComponent<Props> {

    private readonly onPulledFromSide = (from: 'left' | 'right') => {
        this.props.dispatchAction(shiftAllRanges(InteractionType.TouchOnly, from === 'left' ? 'past' : 'future'))
    }

    render() {

        if (this.props.data != null) {
            return <HorizontalPullToActionContainer
                style={styles.containerStyle}
                onPulled={this.onPulledFromSide}
            >
                {
                    this.makeMainView()
                }
            </HorizontalPullToActionContainer>
        } else return <></>
    }

    private makeMainView(): any {
        switch (this.props.source) {
            case DataSourceType.StepCount:
                return <SingleValueCyclicChart dataSource={this.props.source} values={this.props.data.data as any} preferredValueRange={this.props.data.preferredValueRange} cycleType={this.props.cycleType} startFromZero={true} yTickFormat={commaNumber} />
            case DataSourceType.HeartRate:
                return <SingleValueCyclicChart dataSource={this.props.source} values={this.props.data.data as any} preferredValueRange={this.props.data.preferredValueRange} cycleType={this.props.cycleType} startFromZero={false} />
            case DataSourceType.HoursSlept:
                return <SingleValueCyclicChart dataSource={this.props.source} values={this.props.data.data as any} preferredValueRange={this.props.data.preferredValueRange} cycleType={this.props.cycleType} startFromZero={true}
                    yTickFormat={v => DateTimeHelper.formatDuration(v, true)}
                    ticksOverride={(min, max) => {
                        const scale = scaleLinear().domain([min / 3600, max / 3600]).nice()
                        return scale.ticks().map(t => t * 3600)
                    }}
                />
            case DataSourceType.Weight:
                return <SingleValueCyclicChart
                    dataSource={this.props.source}
                    values={this.props.data.data as any}
                    preferredValueRange={this.props.data.preferredValueRange}
                    cycleType={this.props.cycleType}
                    startFromZero={false}
                    valueConverter={
                        (value) => {
                            switch (this.props.measureUnitType) {
                                case MeasureUnitType.Metric:
                                    return value;
                                case MeasureUnitType.US:
                                    return convertUnit(value).from('kg').to('lb')
                            }
                        }
                    }
                />
            case DataSourceType.SleepRange:
                return <RangeValueCyclicChart
                    dataSource={this.props.source}
                    values={this.props.data.data as any}
                    preferredValueRange={this.props.data.preferredValueRange as [number, number]}
                    cycleType={this.props.cycleType}
                    startFromZero={false}
                    ticksOverride={(min, max) => {
                        const scale = scaleLinear().domain([min / 3600, max / 3600]).nice()
                        return scale.ticks().map(t => t * 3600)
                    }}
                    yTickFormat={timeTickFormat}
                    rangeALabel="Bedtime Range"
                    rangeBLabel="Wake Time Range"
                />
        }
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchAction: (action) => dispatch(action)
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        source: explorationInfoHelper.getParameterValue(appState.explorationDataState.info, ParameterType.DataSource),
        cycleType: explorationInfoHelper.getParameterValue(appState.explorationDataState.info, ParameterType.CycleType),
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(CyclicComparisonMainPanel)

export { connected as CyclicComparisonMainPanel }