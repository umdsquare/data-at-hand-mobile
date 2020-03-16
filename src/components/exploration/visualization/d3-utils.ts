import { ScaleBand } from 'd3-scale';

export function getScaleStepLeft<T = any>(scaleBand: ScaleBand<T>, value: T): number {
    return scaleBand(value) + 0.5 * scaleBand.bandwidth() - 0.5 * scaleBand.step()
}