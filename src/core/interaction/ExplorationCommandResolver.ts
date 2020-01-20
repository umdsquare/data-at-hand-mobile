import {
  ExplorationStateInfo,
  ParameterType,
  ParameterKey,
  ExplorationType,
  ExplorationMode,
} from './types';
import {ExplorationCommand, ExplorationCommandType} from './commands';

class ExplorationCommandResolver {
  getNewStateInfo(
    prevStateInfo: ExplorationStateInfo,
    command: ExplorationCommand,
  ): Promise<ExplorationStateInfo> {
    const newStateInfo = JSON.parse(JSON.stringify(prevStateInfo));
    switch (command.type) {
      case ExplorationCommandType.SetRange:
        if (prevStateInfo.type === ExplorationType.B_Day) {
          //noop
        } else {
          explorationCommandResolver.setParameterValue(
            newStateInfo,
            command.range,
            ParameterType.Range,
            command.key as any,
          );
        }
        break;
    }

    return Promise.resolve(newStateInfo);
  }

  getParameterValue<T>(
    stateInfo: ExplorationStateInfo,
    parameter: ParameterType,
    key?: ParameterKey,
  ): T {
    const found = stateInfo.values.find(
      v => v.parameter === parameter && (key == null || v.key === key),
    );
    if (found) {
      return found.value;
    } else return null;
  }

  setParameterValue(
    stateInfo: ExplorationStateInfo,
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

  getMode(stateInfo: ExplorationStateInfo): ExplorationMode {
    switch (stateInfo.type) {
      case ExplorationType.B_Day:
      case ExplorationType.B_Ovrvw:
      case ExplorationType.B_Range:
        return ExplorationMode.Browse;
      case ExplorationType.C_Cyclic:
      case ExplorationType.C_CyclicDetail:
      case ExplorationType.C_TwoRanges:
        return ExplorationMode.Compare;
    }
  }
}

const explorationCommandResolver = new ExplorationCommandResolver();

export {explorationCommandResolver};
