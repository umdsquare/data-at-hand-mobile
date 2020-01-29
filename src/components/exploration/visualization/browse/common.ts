import {ScaleBand, scaleBand} from 'd3-scale';
import {DateTimeHelper} from '../../../../time';
import { PanResponder, LayoutRectangle } from 'react-native';

export namespace CommonBrowsingChartStyles {
  export const xAxisHeight = 26;
  export const yAxisWidth = 50;
  export const rightPadding = 18;
  export const topPadding = 10;
  export const yAxisTickSize = 10;
  export const maxBarSpacing = 0.7;

  export function transformViewXToChartAreaLocalX(x: number): number {
    return x - yAxisWidth;
  }

  export function transformViewYToChartAreaLocalY(y: number): number {
    return y - topPadding;
  }

  export function makeChartArea(
    containerWidth: number,
    containerHeight: number,
  ): LayoutRectangle {
    return {
      x: yAxisWidth,
      y: topPadding,
      width: containerWidth - yAxisWidth - rightPadding,
      height: containerHeight - xAxisHeight - topPadding,
    }
  }

  export function makeDateScale(
    base: ScaleBand<number>,
    startDate: number,
    endDate: number,
  ): ScaleBand<number> {
    return (base || scaleBand<number>()).domain(
      DateTimeHelper.rangeToSequence(startDate, endDate),
    );
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
}