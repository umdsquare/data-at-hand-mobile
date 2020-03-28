import { DataSourceSpec, DataSourceType, DataSourceCategory, DataSourceCategorySpec, MeasureUnitType } from "@measure/DataSourceSpec";
import commaNumber from 'comma-number';
import convert from "convert-units";
import { IntraDayDataSourceType, inferIntraDayDataSourceType } from "@core/exploration/types";
import { Lazy } from "@utils/utils";

export class DataSourceManager {

  private static _instance: DataSourceManager

  static get instance(): DataSourceManager {
    if (this._instance == null) {
      this._instance = new DataSourceManager()
    }
    return this._instance
  }

  readonly supportedDataSources: ReadonlyArray<DataSourceSpec> = [

    {
      type: DataSourceType.StepCount,
      category: DataSourceCategory.Step,
      name: "Step Count",
      description: 'Step Count Walked',
    },
    {
      type: DataSourceType.HeartRate,
      category: DataSourceCategory.HeartRate,
      name: 'Resting Heart Rate',
      description:
        'Heart Rate BPM (Beats per Minute) measured at a specific moment',
    },

    {
      type: DataSourceType.SleepRange,
      category: DataSourceCategory.Sleep,
      name: 'Sleep Range',
      description: "Bedtime and Wake time of the day\'s sleep",
    },

    {
      type: DataSourceType.HoursSlept,
      category: DataSourceCategory.Sleep,
      name: 'Hours Slept',
      description: 'A length of sleep of the day',
    },
    {
      type: DataSourceType.Weight,
      category: DataSourceCategory.Weight,
      name: 'Weight',
      description: 'Body weight measured at a specific moment',
    },
  ];

  private _supportedIntradayDataSources = new Lazy(()=>{
    const result: Array<IntraDayDataSourceType> = []
    DataSourceManager.instance.supportedDataSources.forEach(s => {
      const inferred = inferIntraDayDataSourceType(s.type)
      if (result.indexOf(inferred) === -1 && inferred != null) {
        result.push(inferred)
      }
    })
    return result
  })

  get supportedIntraDayDataSources(): ReadonlyArray<IntraDayDataSourceType> {
    return this._supportedIntradayDataSources.get()
  }

  readonly dataSourceCategorySpecs: { [key: string]: DataSourceCategorySpec } = {}

  private specMap: Map<DataSourceType, DataSourceSpec>;

  private constructor() {

    this.dataSourceCategorySpecs[DataSourceCategory.Step] = {
      category: DataSourceCategory.Step,
      name: "Step"
    }
    this.dataSourceCategorySpecs[DataSourceCategory.Sleep] = {
      category: DataSourceCategory.Sleep,
      name: "Sleep"
    }

    this.dataSourceCategorySpecs[DataSourceCategory.HeartRate] = {
      category: DataSourceCategory.HeartRate,
      name: "Heart Rate"
    }

    this.dataSourceCategorySpecs[DataSourceCategory.Weight] = {
      category: DataSourceCategory.Weight,
      name: 'Weight'
    }

    this.specMap = new Map<DataSourceType, DataSourceSpec>();
    this.supportedDataSources.forEach(spec => {
      this.specMap.set(spec.type, spec)
    });

  }

  getSpec(key: DataSourceType): DataSourceSpec {
    return this.specMap.get(key);
  }

  formatValue(value: any, type: DataSourceType): string {
    switch (type) {
      case DataSourceType.StepCount:
        return commaNumber(Math.round(value))
      default:
        return value.toString()
    }
  }

  convertValue(value: number, type: DataSourceType, unitType: MeasureUnitType): number {
    switch (type) {
      case DataSourceType.Weight:
        switch (unitType) {
          case MeasureUnitType.Metric:
            return value
          case MeasureUnitType.US:
            return Math.round(convert(value).from('kg').to('lb') * 10) / 10
        }
      default:
        return value
    }
  }

  convertValueReverse(value: number, type: DataSourceType, unitType: MeasureUnitType): number {
    switch (type) {
      case DataSourceType.Weight:
        switch (unitType) {
          case MeasureUnitType.Metric:
            return value
          case MeasureUnitType.US:
            return Math.round(convert(value).from('lb').to('kg') * 10) / 10
        }
      default:
        return value
    }
  }
}