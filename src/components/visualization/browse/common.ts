import { ScaleBand, scaleBand } from 'd3-scale';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { LayoutRectangle, Dimensions } from 'react-native';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { DataDrivenQuery, NumericConditionType } from '@data-at-hand/core/exploration/ExplorationInfo';
import { useMemo } from 'react';
import Colors from '@style/Colors';
import React from 'react';
import { DateSequenceCache } from '@utils/DateSequenceCache';

export const DateRangeScaleContext = React.createContext<ScaleBand<number>>(null)

export interface ChartPropsBase<T> {
  dateRange: number[],
  preferredValueRange: number[],
  data: T,
  goalValue?: number,
  dataDrivenQuery?: DataDrivenQuery,
  highlightedDays?: { [key: number]: boolean | undefined }
}

export interface ChartProps extends ChartPropsBase<Array<{ value: number, numberedDate: number }>> {
  dataSource: DataSourceType,
}


export namespace CommonBrowsingChartStyles {

  export const xAxisHeight = 26;
  export const yAxisWidth = 50;
  export const rightPadding = 18;
  export const topPadding = 10;
  export const yAxisTickSize = 10;
  export const maxBarSpacing = 0.7;

  export const AVERAGE_LINE_WIDTH = 1.5;

  export const chartAreaPadding = {
    left: yAxisWidth,
    top: topPadding,
    right: rightPadding,
    bottom: xAxisHeight
  }

  export const chartAreaPaddingNegative = {
    left: -chartAreaPadding.left,
    top: -chartAreaPadding.top,
    right: -chartAreaPadding.right,
    bottom: -chartAreaPadding.bottom
  }


  export const CHART_WIDTH = Dimensions.get("window").width
  const CHART_HEIGHT_BASE = Math.round(CHART_WIDTH / 3)
  export const CHART_HEIGHT = CHART_WIDTH > 520? Math.min(CHART_HEIGHT_BASE, 120) : CHART_HEIGHT_BASE // for Foldable

  console.log("chart height:", CHART_HEIGHT)

  export const CHART_AREA: LayoutRectangle = {
    x: yAxisWidth,
    y: topPadding,
    width: CHART_WIDTH - yAxisWidth - rightPadding,
    height: CHART_HEIGHT - xAxisHeight - topPadding,
  }

  export function transformViewXToChartAreaLocalX(x: number): number {
    return x - yAxisWidth;
  }

  export function transformViewYToChartAreaLocalY(y: number): number {
    return y - topPadding;
  }

  export function makeDateScale(
    base: ScaleBand<number> | undefined,
    startDate: number,
    endDate: number,
    padding: number = 0.2,
  ): ScaleBand<number> {

    const sequence = DateSequenceCache.instance.getSequence(startDate, endDate)

    return (base || scaleBand<number>()).domain(
      sequence,
    ).padding(padding)
      .range([0, CHART_AREA.width])
  }

  export function dateTickFormat(today: number): (date: number) => string {
    return (date: number) => {
      if (today === date) {
        return 'Today';
      } else {
        const m = DateTimeHelper.getMonth(date);
        const d = DateTimeHelper.getDayOfMonth(date);
        return m + '/' + d;
      }
    };
  }

  export function makeHighlightInformation<T>(prop: ChartPropsBase<T>,
    dataSource: DataSourceType,
    getDataArray?: (data: T) => Array<{ numberedDate: number, value: number }>) {

    const shouldHighlightElements = useMemo(() => prop.dataDrivenQuery != null && prop.dataDrivenQuery.dataSource === dataSource && prop.highlightedDays != null, [
      prop.dataDrivenQuery,
      (prop as any)["dataSource"],
      prop.highlightedDays
    ])

    const highlightReference = useMemo(() => {
      if (prop.dataDrivenQuery != null && prop.dataDrivenQuery.dataSource === dataSource) {

        switch (prop.dataDrivenQuery.type) {
          case NumericConditionType.Less:
          case NumericConditionType.More:
            return prop.dataDrivenQuery.ref!
          case NumericConditionType.Max:
          case NumericConditionType.Min:
            const array = getDataArray ? getDataArray(prop.data) : prop.data as any
            if (array.length > 0 && prop.highlightedDays) {
              const extremeDays = Object.keys(prop.highlightedDays)
              if (extremeDays.length > 0) {
                const extremeDatum = array.find((d: { numberedDate: number }) => d.numberedDate === Number.parseInt(extremeDays[0]))
                if (extremeDatum) {
                  if (dataSource === DataSourceType.SleepRange) {
                    if (prop.dataDrivenQuery!.propertyKey === 'waketime') {
                      return extremeDatum["wakeTimeDiffSeconds"]
                    } else return extremeDatum["bedTimeDiffSeconds"]
                  } else return extremeDatum.value
                }
              }
            }
        }
        return null
      } else return null
    }, [shouldHighlightElements, prop.dataDrivenQuery, prop.data])

    return {
      shouldHighlightElements,
      highlightReference
    }
  }
}

export function getChartElementColor(shouldHighlightElements: boolean, isHighlighted: boolean, isToday: boolean): string {
  return shouldHighlightElements === true && isHighlighted == true ?
    Colors.highlightElementColor :
    (isToday === true ? Colors.today : Colors.chartElementDefault)
}

export function getChartElementOpacity(isToday: boolean): number {
  return isToday === true ? 0.8 : 0.62
}