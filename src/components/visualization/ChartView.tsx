import React from 'react';
import { VisualizationSchema, ChartType } from '../../core/visualization/types';
import { View, LayoutChangeEvent } from 'react-native';
import { TimelineBarChartComponent } from './TimelineBarChartComponent';

export interface ChartComponentProps {
    schema: VisualizationSchema,
    containerWidth: number,
    containerHeight: number
}

interface Props {
    schema: VisualizationSchema
}

interface State {
    width: number,
    height: number
}

export class ChartView extends React.Component<Props, State> {

    constructor(props) {
        super(props)
        this.state = {
            width: -1,
            height: -1
        }
    }

    private onContainerLayoutChanged = (layoutChangeEvent: LayoutChangeEvent) => {
        const { layout } = layoutChangeEvent.nativeEvent
        if (this.state.width != layout.width || this.state.height != layout.height) {
            this.setState({
                width: layout.width,
                height: layout.height
            })
        }
    }

    render() {
        let body = null
        if (this.state.width > 0 && this.state.height > 0) {
            switch (this.props.schema.type) {
                case ChartType.TimeseriesBarChart:
                    body = <TimelineBarChartComponent schema={this.props.schema} containerWidth={this.state.width} containerHeight={this.state.height} />
                    break;
            }
        }

        return <View style={{ flex: 1 }} onLayout={this.onContainerLayoutChanged}>
            {body}
        </View>
    }
}