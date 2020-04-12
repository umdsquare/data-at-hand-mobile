import {
  DataService,
  UnSupportedReason,
  ServiceActivationResult,
} from '../DataService';
import { FitbitServiceCore } from './types';
import { DataSourceType, IntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { FitbitDailyStepMeasure } from './FitbitDailyStepMeasure';
import { FitbitDailyHeartRateMeasure } from './FitbitDailyHeartRateMeasure';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { FitbitWeightMeasure } from './FitbitWeightMeasure';
import { FitbitSleepMeasure } from './FitbitSleepMeasure';
import { FitbitIntraDayStepMeasure } from './FitbitIntraDayStepMeasure';
import { FitbitIntraDayHeartRateMeasure } from './FitbitIntraDayHeartRateMeasure';
import { GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue, FilteredDailyValues, BoxPlotInfo } from '@core/exploration/data/types';
import { CyclicTimeFrame, CycleDimension } from '@data-at-hand/core/exploration/CyclicTimeFrame';
import { FitbitLocalTableName } from './sqlite/database';
import { HighlightFilter, NumericConditionType } from '@data-at-hand/core/exploration/ExplorationInfo';
import { FitbitServiceMeasureBase } from './FitbitServiceMeasureBase';


export default class FitbitService extends DataService {
  readonly key: string
  readonly name: string
  readonly description: string
  readonly thumbnail: any

  private _core: FitbitServiceCore
  get core(): FitbitServiceCore {
    return this._core
  }

  constructor(core: FitbitServiceCore) {
    super()
    this._core = core

    this.key = core.keyOverride || 'fitbit'
    this.name = core.nameOverride || 'Fitbit'
    this.description = core.descriptionOverride || 'Fitbit Fitness Tracker'
    this.thumbnail = core.thumbnailOverride || require('@assets/images/services/service_fitbit.jpg')

    this.dailyStepMeasure = new FitbitDailyStepMeasure(core);
    this.dailyHeartRateMeasure = new FitbitDailyHeartRateMeasure(core);
    this.weightLogMeasure = new FitbitWeightMeasure(core);
    this.sleepMeasure = new FitbitSleepMeasure(core);
  
    this.intradayStepMeasure = new FitbitIntraDayStepMeasure(core);
    this.intradayHeartRateMeasure = new FitbitIntraDayHeartRateMeasure(core);

    this.preloadableMeasures = [
      this.dailyStepMeasure,
      this.dailyHeartRateMeasure,
      this.weightLogMeasure,
      this.sleepMeasure,
      this.intradayStepMeasure,
      this.intradayHeartRateMeasure
    ];
  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    return true;
  }

  readonly dailyStepMeasure: FitbitDailyStepMeasure;
  readonly dailyHeartRateMeasure: FitbitDailyHeartRateMeasure;
  readonly weightLogMeasure: FitbitWeightMeasure;
  readonly sleepMeasure: FitbitSleepMeasure;

  readonly intradayStepMeasure: FitbitIntraDayStepMeasure;
  readonly intradayHeartRateMeasure: FitbitIntraDayHeartRateMeasure;

  private readonly preloadableMeasures: Array<FitbitServiceMeasureBase>


  async getPreferredValueRange(dataSource: DataSourceType): Promise<[number, number]> {
    let boxPlotInfo: BoxPlotInfo
    switch (dataSource) {
      case DataSourceType.StepCount:
        boxPlotInfo = await this.dailyStepMeasure.getBoxPlotInfoOfDataset()
        break;
      case DataSourceType.HeartRate:
        boxPlotInfo = await this.dailyHeartRateMeasure.getBoxPlotInfoOfDataset()
        break;
      case DataSourceType.Weight:
        boxPlotInfo = await this.weightLogMeasure.getBoxPlotInfoOfDataset()
        break;
      case DataSourceType.HoursSlept:
        boxPlotInfo = await this.sleepMeasure.getBoxPlotInfoOfDataset('length')
        break;
      case DataSourceType.SleepRange:
        boxPlotInfo = await this.sleepMeasure.getBoxPlotInfoOfDataset('range')
        break;
    }

    return [boxPlotInfo.minWithoutOutlier, boxPlotInfo.maxWithoutOutlier]
  }


  async fetchFilteredDates(filter: HighlightFilter, start: number, end: number): Promise<{ [key: number]: boolean | undefined }> {
    let tableName
    let valueColumnName = 'value'
    let selectClause = 'SELECT numberedDate'
    let whereClause = null

    switch (filter.dataSource) {
      case DataSourceType.StepCount:
        tableName = FitbitLocalTableName.StepCount
        break;
      case DataSourceType.HeartRate:
        tableName = FitbitLocalTableName.RestingHeartRate
        break;
      case DataSourceType.Weight:
        tableName = FitbitLocalTableName.WeightTrend
        break;
      case DataSourceType.HoursSlept:
        tableName = FitbitLocalTableName.SleepLog
        valueColumnName = 'lengthInSeconds'
        break;
      case DataSourceType.SleepRange:
        tableName = FitbitLocalTableName.SleepLog
        switch (filter.propertyKey) {
          case 'waketime':
            valueColumnName = 'wakeTimeDiffSeconds'
            break;
          case 'bedtime':
            valueColumnName = 'bedTimeDiffSeconds'
            break;
        }
        break;
    }

    switch (filter.type) {
      case NumericConditionType.Less:
        whereClause = `${valueColumnName} <= ${filter.ref}`
        break;
      case NumericConditionType.More:
        whereClause = `${valueColumnName} >= ${filter.ref}`
        break;
      case NumericConditionType.Max:
        selectClause = `SELECT numberedDate, max(${valueColumnName})`
        break;
      case NumericConditionType.Min:
        selectClause = `SELECT numberedDate, min(${valueColumnName})`
        break;
    }

    const query = `${selectClause} from ${tableName} where ${whereClause != null ? `${whereClause} AND ` : ""} numberedDate BETWEEN ${start} AND ${end}`
    const queryResult: Array<any> = await this.core.fitbitLocalDbManager.selectQuery(query)
    if (queryResult.length > 0) {
      const result: any = {}
      queryResult.forEach(v => result[v["numberedDate"]] = true)
      return result
    } else return null
  }

  protected async fetchDataImpl(
    dataSource: DataSourceType,
    start: number,
    end: number,
    includeStatistics: boolean,
    includeToday: boolean,
  ): Promise<any> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchData(start, end, includeStatistics, includeToday);
      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchData(start, end, includeStatistics, includeToday);
      case DataSourceType.HoursSlept:
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchData(dataSource, start, end, includeStatistics, includeToday);
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchData(start, end, includeStatistics, includeToday);
    }
  }

  async fetchIntraDayData(
    intraDayDataSource: IntraDayDataSourceType,
    date: number,
  ): Promise<any> {
    const now = DateTimeHelper.toNumberedDateFromDate(this.core.getToday());
    if (date <= now) {
      switch (intraDayDataSource) {
        case IntraDayDataSourceType.StepCount:
          return await this.intradayStepMeasure.fetchData(date);
        case IntraDayDataSourceType.HeartRate:
          return await this.intradayHeartRateMeasure.fetchData(date);
        case IntraDayDataSourceType.Sleep:
          return await this.sleepMeasure.fetchIntraDayData(date);
      }
    }
    return null;
  }

  async fetchCyclicAggregatedData(
    dataSource: DataSourceType,
    start: number,
    end: number,
    cycle: CyclicTimeFrame,
  ): Promise<GroupedData | GroupedRangeData> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchCyclicGroupedData(
          start,
          end,
          cycle,
        );
      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchCyclicGroupedData(
          start,
          end,
          cycle,
        );
      case DataSourceType.HoursSlept:
        return await this.sleepMeasure.fetchHoursSleptCyclicGroupedData(
          start,
          end,
          cycle,
        );
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchCyclicGroupedData(
          start,
          end,
          cycle,
        );
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchSleepRangeCyclicGroupedData(
          start,
          end,
          cycle,
        );
    }
  }

  async fetchRangeAggregatedData(
    dataSource: DataSourceType,
    start: number,
    end: number,
  ): Promise<IAggregatedValue | IAggregatedRangeValue> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchRangeGroupedData(start, end);
      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchRangeGroupedData(start, end);
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchRangeGroupedData(start, end);
      case DataSourceType.HoursSlept:
        return await this.sleepMeasure.fetchHoursSleptAggregatedData(start, end);
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchSleepRangeAggregatedData(start, end);
    }
  }


  async fetchCycleRangeDimensionDataImpl(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedRangeValue[] | IAggregatedValue[]> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchCycleRangeDimensionData(start, end, cycleDimension)
      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchCycleRangeDimensionData(start, end, cycleDimension)
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchCycleRangeDimensionData(start, end, cycleDimension)
      case DataSourceType.HoursSlept:
        return await this.sleepMeasure.fetchHoursSleptRangeDimensionData(start, end, cycleDimension)
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchSleepRangeCycleRangeDimensionData(start, end, cycleDimension)
    }
  }


  async fetchCycleDailyDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchCycleDailyDimensionData(start, end, cycleDimension)
      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchCycleDailyDimensionData(start, end, cycleDimension)
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchCycleDailyDimensionData(start, end, cycleDimension)
      case DataSourceType.HoursSlept:
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchCycleDailyDimensionData(dataSource, start, end, cycleDimension)
    }
  }

  /***
   * return: Access token
   */
  async authenticate(): Promise<string> {
    return this.core.authenticate()
  }

  async signOut(): Promise<void> {
    await this.core.signOut()
    await this.core.fitbitLocalDbManager.close();
    await this.core.fitbitLocalDbManager.deleteDatabase();
  }

  async refreshDataToReflectRecentInfo(): Promise<void> {
    const now = DateTimeHelper.toNumberedDateFromDate(this.core.getToday());

    for (const measure of this.preloadableMeasures) {
      await measure.cacheServerData(now);
    }

  }


  async activateInSystem(progressHandler: (progressInfo: {
    progress: number; message: string;
  }) => void): Promise<ServiceActivationResult> {
    try {
      console.log("start Fitbit activation...")
      progressHandler({
        progress: 0,
        message: "Authenticating your Fitbit account..."
      })
      const accessToken = await this.authenticate();
      if (accessToken != null) {
        const now = DateTimeHelper.toNumberedDateFromDate(this.core.getToday());

        for (const measure of this.preloadableMeasures) {
          progressHandler({
            progress: 0,
            message: `Fetching ${measure.displayName} data...`
          })
          await measure.cacheServerData(now);
        }

        return {
          success: true,
        };
      } else
        return {
          success: false,
        };
    } catch (ex) {
      console.log("activation error:")
      console.log(ex);
      return { success: false, error: ex };
    }
  }

  async deactivatedInSystem(): Promise<boolean> {
    try {
      await this.signOut();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async onSystemExit(): Promise<void> {
    await this.core.fitbitLocalDbManager.close();
  }

  getMembershipStartDate(): Promise<number> {
    return this.core.getMembershipStartDate()
  }

  getDataInitialDate(): Promise<number> {
    return this.getMembershipStartDate()
  }

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    return this.core.onCheckSupportedInSystem()
  }

  async clearAllCache(): Promise<void> {
    await Promise.all(
      this.preloadableMeasures.map(measure => measure.clearLocalCache()).concat(this.core.fitbitLocalDbManager.deleteDatabase())
    )
  }

  async exportToCsv(): Promise<Array<{ name: string, csv: string }>> {
    return this.core.fitbitLocalDbManager.exportToCsv()
  }

  get getToday() {
    return this.core.getToday
  }

  get isQuotaLimited(): boolean {
    return this.core.isQuotaLimited
  }

  getLeftQuota(): Promise<number> {
    return this.core.getLeftQuota()
  }

  getQuotaResetEpoch(): Promise<number> {
    return this.core.getQuotaResetEpoch()
  }

}
