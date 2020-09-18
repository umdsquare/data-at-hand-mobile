import { DataSourceType, IntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue, RangeAggregatedComparisonData, FilteredDailyValues, OverviewSourceRow } from '../../core/exploration/data/types';
import { CyclicTimeFrame, CycleDimension, getCycleLevelOfDimension, getTimeKeyOfDimension, getCycleTypeOfDimension } from '@data-at-hand/core/exploration/CyclicTimeFrame';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { getNumberSequence } from '@data-at-hand/core/utils';
import { writeFile, TemporaryDirectoryPath, exists, mkdir } from 'react-native-fs';
import { zip } from 'react-native-zip-archive'
import Share from 'react-native-share'
import { DataDrivenQuery } from '@data-at-hand/core/exploration/ExplorationInfo';

export interface ServiceActivationResult {
  success: boolean,
  error?: any
}

export enum ServiceApiErrorType {
  CredentialError = "credential",
  QuotaLimitReached = "quota-limit",
}

export abstract class DataService {
  static readonly STORAGE_PREFIX = "@source_service:"

  abstract readonly key: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly thumbnail: any;

  private supportCheckResult: {
    supported: boolean;
    reason?: UnSupportedReason;
  } = null;

  async checkSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    if (this.supportCheckResult) {
      return Promise.resolve(this.supportCheckResult);
    } else {
      this.supportCheckResult = await this.onCheckSupportedInSystem();
      return this.supportCheckResult;
    }
  }

  protected abstract onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }>;

  abstract isDataSourceSupported(dataSource: DataSourceType): boolean

  fetchData(dataSource: DataSourceType, start: number, end: number, includeStatistics: boolean = true, includeToday: boolean = true): Promise<OverviewSourceRow> {
    /*
    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    if(start > today) {
      return Promise.resolve(null)
    }else{
      return this.fetchDataImpl(dataSource, level, start, Math.min(end, today))
    }*/
    return this.fetchDataImpl(dataSource, start, end, includeStatistics, includeToday)
  }

  async refreshDataToReflectRecentInfo(): Promise<void> {
    return
  }

  abstract getGoalValue(dataSource: DataSourceType): Promise<number | undefined>

  abstract getPreferredValueRange(dataSource: DataSourceType): Promise<[number, number]>

  abstract fetchFilteredDates(filter: DataDrivenQuery, start: number, end: number): Promise<{ [key: number]: boolean | undefined }>

  abstract fetchIntraDayData(intraDayDataSource: IntraDayDataSourceType, date: number): Promise<any>

  protected abstract fetchDataImpl(dataSource: DataSourceType, start: number, end: number, includeStatistics: boolean, includeToday: boolean): Promise<any>

  abstract fetchCyclicAggregatedData(dataSource: DataSourceType, start: number, end: number, cycle: CyclicTimeFrame): Promise<GroupedData | GroupedRangeData>

  abstract fetchRangeAggregatedData(dataSource: DataSourceType, start: number, end: number): Promise<IAggregatedValue | IAggregatedRangeValue>

  protected abstract fetchCycleRangeDimensionDataImpl(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedRangeValue[] | IAggregatedValue[]>

  async fetchCycleRangeDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<RangeAggregatedComparisonData<IAggregatedRangeValue | IAggregatedValue>> {
    const result = await this.fetchCycleRangeDimensionDataImpl(dataSource, start, end, cycleDimension)


    const cycleLevel = getCycleLevelOfDimension(cycleDimension)
    const dimensionIndex = getTimeKeyOfDimension(cycleDimension)
    const cycleType = getCycleTypeOfDimension(cycleDimension)

    let timeKeySequence: Array<{ timeKey: number, range: [number, number] }>
    switch (cycleLevel) {
      case "year":
        timeKeySequence = getNumberSequence(DateTimeHelper.getYear(start), DateTimeHelper.getYear(end)).map(year => {

          let range: [number, number]
          switch (cycleType) {
            case CyclicTimeFrame.MonthOfYear: {
              const pivot = new Date(year, dimensionIndex - 1, 1)
              range = [DateTimeHelper.toNumberedDateFromDate(startOfMonth(pivot)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(pivot))]
            }
              break;
            case CyclicTimeFrame.SeasonOfYear: {
              /*
              0 => 2,3,4
              1 => 5,6,7
              2 => 8,9,10
              3 => 11,0,1
              */
              const seasonStart = new Date(year, dimensionIndex * 3 + 2, 1)
              const seasonEnd = addMonths(seasonStart, 3)

              range = [DateTimeHelper.toNumberedDateFromDate(startOfMonth(seasonStart)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(seasonEnd))]
            }
              break;
          }

          if (range[1] < start || range[0] > end) {
            return null
          } else return { timeKey: year, range: range }
        }).filter(elm => elm != null)
        break;
    }

    return {
      data: timeKeySequence.map(elm => {
        const datum = (result as any).find((d: { timeKey: number; }) => d.timeKey === elm.timeKey)
        return { range: elm.range, value: datum }
      })
    }
  }

  abstract fetchCycleDailyDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues>

  abstract async activateInSystem(progressHandler: (progressInfo: { progress: number /*0 - 1*/, message: string }) => void): Promise<ServiceActivationResult>
  abstract async deactivatedInSystem(): Promise<boolean>

  private _getToday = (): Date => {
    return new Date();
  };
  public get getToday() {
    return this._getToday;
  }
  public set getToday(value) {
    this._getToday = value;
  }

  abstract getDataInitialDate(): Promise<number>

  abstract async clearAllCache(): Promise<void>

  abstract onSystemExit(): Promise<void>

  abstract isQuotaLimited: boolean
  abstract getLeftQuota(): Promise<number>
  abstract getQuotaResetEpoch(): Promise<number>

  protected abstract exportToCsv(): Promise<Array<{ name: string, csv: string }>>

  async exportData(): Promise<boolean> {
    const exported = await this.exportToCsv()
    if (exported.length > 0) {
      const directoryPath = TemporaryDirectoryPath
      let finalFilePath: string
      let mimeType: string
      if (exported.length === 1) {
        //single file. export the text to file
        finalFilePath = `${directoryPath}exported_data_${this.key}_${exported[0].name}.csv`
        mimeType = 'text/csv'
        await writeFile(finalFilePath, exported[0].csv, 'utf8')
      } else {
        //multiple files. zip file
        const filesContainingDirectory = `${directoryPath}exported_data_${this.key}`
        if (await exists(filesContainingDirectory) === false) {
          await mkdir(filesContainingDirectory)
        }

        await Promise.all(exported.map(info => {
          return writeFile(filesContainingDirectory + "/" + info.name + ".csv", info.csv, 'utf8')
        }))
        finalFilePath = filesContainingDirectory + '.zip'
        finalFilePath = await zip(filesContainingDirectory, finalFilePath)
        mimeType = "application/zip"
      }

      try {
        const shareResult = await Share.open({
          url: "file://" + finalFilePath,
          type: mimeType,
          showAppsToView: true
        })
        console.log(shareResult)
      } catch (e) {
        console.log(e)
      }
      return true
    }
    return true
  }

}

export enum UnSupportedReason {
  OS,
  Credential,
}
