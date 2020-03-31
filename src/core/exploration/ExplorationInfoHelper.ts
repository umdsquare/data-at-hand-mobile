import {
  IntraDayDataSourceType,
  getIntraDayDataSourceName,
} from './types';
import { DataSourceType, DataSourceSpec } from '@measure/DataSourceSpec';
import { DataSourceManager } from '@measure/DataSourceManager';
import {
  ExplorationInfo,
  ParameterType,
  ParameterKey,
  ExplorationType,
  ExplorationMode,
  ExplorationInfoParameter,
  ExplorationInfoParams,
} from './ExplorationInfo';

class ExplorationInfoHelper {
  getParameterValue<T>(
    stateInfo: ExplorationInfo,
    parameter: ParameterType,
    key?: ParameterKey,
  ): T | null {
    return this.getParameterValueOfParams<T>(stateInfo.values, parameter, key);
  }

  getParameterValueOfParams<T>(
    paramSet: ExplorationInfoParams,
    parameter: ParameterType,
    key?: ParameterKey,
  ): T | null {
    const found = paramSet.find(
      v => v.parameter === parameter && (key == null || v.key === key),
    );
    if (found) {
      return found.value;
    } else return null;
  }

  setParameterValue(
    stateInfo: ExplorationInfo,
    value: any,
    parameter: ParameterType,
    key?: ParameterKey,
  ) {
    const index = stateInfo.values.findIndex(
      entry =>
        entry.parameter === parameter && (key == null || entry.key === key),
    );
    if (index >= 0) {
      stateInfo.values[index].value = value;
    } else {
      stateInfo.values.push({
        parameter: parameter,
        key: key,
        value: value,
      });
    }
  }

  filterParameters(
    stateInfo: ExplorationInfo,
    filterFunc: (parameter: ExplorationInfoParameter) => boolean,
  ) {
    stateInfo.values = stateInfo.values.filter(
      param => filterFunc(param) === true,
    );
  }

  getMode(stateInfo: ExplorationInfo): ExplorationMode {
    switch (stateInfo.type) {
      case ExplorationType.B_Day:
      case ExplorationType.B_Overview:
      case ExplorationType.B_Range:
        return ExplorationMode.Browse;
      case ExplorationType.C_Cyclic:
      case ExplorationType.C_CyclicDetail_Daily:
      case ExplorationType.C_CyclicDetail_Range:
      case ExplorationType.C_TwoRanges:
        return ExplorationMode.Compare;
    }
  }

  equals(a: ExplorationInfo, b: ExplorationInfo) {
    if (a === b) {
      return true
    } else {
      if (a.type === b.type && a.values.length === b.values.length && a.highlightFilter === b.highlightFilter) {
        var deepEqual = require('deep-equal');
        for (const aParameter of a.values) {
          const bParameter = b.values.find(bParameter =>
            bParameter.key === aParameter.key
            && bParameter.parameter === aParameter.parameter
            && deepEqual(bParameter.value, aParameter.value) === true)
          if (bParameter == null) {
            return false
          }
        }
        return true
      } else return false
    }
  }

  getDataSourceSpecInInfo(info: ExplorationInfo): DataSourceSpec | null {
    const dataSource = this.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
    if (dataSource) {
      return DataSourceManager.instance.getSpec(dataSource)
    } else return null
  }

  getTitleText(info: ExplorationInfo): string | null {
    switch (info.type) {
      case ExplorationType.B_Day:
        {
          const dataSource = this.getParameterValue<IntraDayDataSourceType>(info, ParameterType.IntraDayDataSource)
          return "Daily " + getIntraDayDataSourceName(dataSource)
        }
      case ExplorationType.B_Overview:
        {
          return "Home Browsing"
        }
      case ExplorationType.B_Range:
        {
          const spec = this.getDataSourceSpecInInfo(info)
          if (spec)
            return spec.name
        } break;
      case ExplorationType.C_Cyclic:
      case ExplorationType.C_CyclicDetail_Daily:
      case ExplorationType.C_CyclicDetail_Range:
      case ExplorationType.C_TwoRanges:
        {
          const spec = this.getDataSourceSpecInInfo(info)
          if (spec)
            return spec.name + " Comparison"
        } break;
    }
    return null
  }
}

const explorationInfoHelper = new ExplorationInfoHelper();

export { explorationInfoHelper };
