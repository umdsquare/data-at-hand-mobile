import {
  ExplorationInfo,
  ParameterType,
  ParameterKey,
  ExplorationType,
  ExplorationMode,
  ExplorationInfoParameter,
} from './types';

class ExplorationInfoHelper {
  getParameterValue<T>(
    stateInfo: ExplorationInfo,
    parameter: ParameterType,
    key?: ParameterKey,
  ): T|null {
    return this.getParameterValueOfParams<T>(stateInfo.values, parameter, key);
  }

  getParameterValueOfParams<T>(
    paramSet: Array<ExplorationInfoParameter>,
    parameter: ParameterType,
    key?: ParameterKey,
  ): T|null {
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
}

const explorationInfoHelper = new ExplorationInfoHelper();

export {explorationInfoHelper};
