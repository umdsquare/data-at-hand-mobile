import {
  DataService,
  UnSupportedReason,
  ServiceActivationResult,
} from '../DataService';
import { FitbitServiceCore } from './types';
import { DataSourceType } from '../../DataSourceSpec';
import { FitbitDailyStepMeasure } from './FitbitDailyStepMeasure';
import { FitbitDailyHeartRateMeasure } from './FitbitDailyHeartRateMeasure';
import { DateTimeHelper } from '../../../time';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { FitbitWeightMeasure } from './FitbitWeightMeasure';
import { FitbitSleepMeasure } from './FitbitSleepMeasure';
import { FitbitIntraDayStepMeasure } from './FitbitIntraDayStepMeasure';
import { IntraDayDataSourceType } from '../../../core/exploration/types';
import { FitbitIntraDayHeartRateMeasure } from './FitbitIntraDayHeartRateMeasure';
import { GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue, FilteredDailyValues, BoxPlotInfo } from '../../../core/exploration/data/types';
import { CyclicTimeFrame, CycleDimension } from '../../../core/exploration/cyclic_time';


export class FitbitService extends DataService {
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
    this.thumbnail = core.thumbnailOverride || require('../../../../assets/images/services/service_fitbit.jpg')

  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    return true;
  }

  readonly dailyStepMeasure = new FitbitDailyStepMeasure(this);
  readonly dailyHeartRateMeasure = new FitbitDailyHeartRateMeasure(this);
  readonly weightLogMeasure = new FitbitWeightMeasure(this);
  readonly sleepMeasure = new FitbitSleepMeasure(this);

  readonly intradayStepMeasure = new FitbitIntraDayStepMeasure(this);
  readonly intradayHeartRateMeasure = new FitbitIntraDayHeartRateMeasure(this);

  private preloadableMeasures: Array<FitbitServiceMeasure> = [
    this.dailyStepMeasure,
    this.dailyHeartRateMeasure,
    this.weightLogMeasure,
    this.sleepMeasure,
  ];


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

  protected async fetchDataImpl(
    dataSource: DataSourceType,
    start: number,
    end: number,
  ): Promise<any> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        return await this.dailyStepMeasure.fetchData(start, end);

      case DataSourceType.HeartRate:
        return await this.dailyHeartRateMeasure.fetchData(start, end);
      case DataSourceType.HoursSlept:
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchData(dataSource, start, end);
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchData(start, end);
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
        const initialDate = await this.getMembershipStartDate();
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
          serviceInitialDate: initialDate,
        };
      } else
        return {
          success: false,
        };
    } catch (ex) {
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

  private _lastSyncTimePromise?: Promise<{tracker?: Date, scale?: Date}> = null
  private _lastSyncTimeInvokedAt?: number = null

  async getLastSyncTime(): Promise<{tracker?: Date, scale?: Date}>{
    if(this._lastSyncTimePromise == null || (Date.now() - this._lastSyncTimeInvokedAt) > 5*60*1000){
      this._lastSyncTimePromise = this.core.fetchLastSyncTime()
      this._lastSyncTimeInvokedAt = Date.now()
    }
    return this._lastSyncTimePromise
  }

  getMembershipStartDate(): Promise<number> {
    return this.core.getMembershipStartDate()
  }

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    return this.core.onCheckSupportedInSystem()
  }

  async clearAllCache(): Promise<void> {
    await this.core.fitbitLocalDbManager.deleteDatabase()
  }

  async exportToCsv(): Promise<Array<{ name: string, csv: string }>> {
    return this.core.fitbitLocalDbManager.exportToCsv()
  }

  getToday = () => {
    return this.core.getToday()
  }
}
