import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StyleTemplates } from '../../../../../style/Styles';
import { GroupedData, CyclicTimeFrame, GroupedRangeData } from '../../../../../core/exploration/data/types';
import { Dispatch } from 'redux';
import { ReduxAppState } from '../../../../../state/types';
import { DataSourceType, MeasureUnitType } from '../../../../../measure/DataSourceSpec';
import { explorationInfoHelper } from '../../../../../core/exploration/ExplorationInfoHelper';
import { ParameterType } from '../../../../../core/exploration/types';
import { connect } from 'react-redux';
import { SingleValueCyclicChart } from '../../../../exploration/visualization/compare/SingleValueCyclicChart';
import commaNumber from 'comma-number';
import { DateTimeHelper } from '../../../../../time';
import { scaleLinear } from 'd3-scale';
import convertUnit from 'convert-units';
import { RangeValueCyclicChart } from '../../../../exploration/visualization/compare/RangeValueCyclicChart';
import { startOfDay, format, addSeconds } from 'date-fns';

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fillFlex,
        backgroundColor: 'white'
    }
})

const timePivot = startOfDay(new Date())

const timeTickFormat = (tick:number) => {
    if(tick === 0){
        return "MN"
    }
    else return format(addSeconds(timePivot, tick),"h a").toLowerCase()
}

interface Props {
    data?: GroupedData | GroupedRangeData,
    source?: DataSourceType,
    cycleType?: CyclicTimeFrame,
    measureUnitType?: MeasureUnitType
}

class CyclicComparisonMainPanel extends React.Component<Props> {
    render() {

        if (this.props.data != null) {
            return <View style={styles.containerStyle}>
                {
                    this.makeMainView()
                }
            </View>
        } else return <></>
    }

    private makeMainView(): any {
        switch (this.props.source) {
            case DataSourceType.StepCount:
                return <SingleValueCyclicChart values={this.props.data.data as any} cycleType={this.props.cycleType} startFromZero={true} yTickFormat={commaNumber} />
            case DataSourceType.HeartRate:
                return <SingleValueCyclicChart values={this.props.data.data as any} cycleType={this.props.cycleType} startFromZero={false} />
            case DataSourceType.HoursSlept:
                return <SingleValueCyclicChart values={this.props.data.data as any} cycleType={this.props.cycleType} startFromZero={true}
                    yTickFormat={v => DateTimeHelper.formatDuration(v, true)}
                    ticksOverride={(min, max) => {
                        const scale = scaleLinear().domain([min / 3600, max / 3600]).nice()
                        return scale.ticks().map(t => t * 3600)
                    }}
                />
            case DataSourceType.Weight:
                return <SingleValueCyclicChart
                    values={this.props.data.data as any}
                    cycleType={this.props.cycleType}
                    startFromZero={false}
                    valueConverter = {
                        (value) => {
                            switch(this.props.measureUnitType){
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
                values={this.props.data.data as any}
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