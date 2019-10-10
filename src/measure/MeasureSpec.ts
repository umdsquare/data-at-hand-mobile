export enum MeasureType {
  Point = 'point',
  Session = 'session',
  Bin = 'bin',
}

export interface MeasureSpec {
    readonly type: MeasureType
    readonly nameKey: string
    readonly name: string
    readonly description: string
}
