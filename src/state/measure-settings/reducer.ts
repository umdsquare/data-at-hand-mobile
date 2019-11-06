import {
  MeasureSettingsAction,
  MeasureSettingsActionTypes,
  SelectSourceForMeasureAction,
  DeselectSourceForMeasureAction,
  SetUnitTypeAction,
} from './actions';
import {MeasureSpec, MeasureUnitType} from '../../measure/MeasureSpec';
import {SourceSelectionInfo} from '../../system/SourceManager';

export interface MeasureSettingsState {
  selectionInfoList: Array<{
    measureSpecKey: string;
    sourceSelectionInfo: SourceSelectionInfo;
  }>,
  unit: MeasureUnitType
}

const INITIAL_STATE = {
  selectionInfoList: [],
  unit: MeasureUnitType.Metric
} as MeasureSettingsState;

export const measureSettingsStateReducer = (
  state: MeasureSettingsState = INITIAL_STATE,
  action: MeasureSettingsAction,
): MeasureSettingsState => {
  const newState: MeasureSettingsState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case MeasureSettingsActionTypes.SelectSourceForMeasure:
      selectSourceForMeasureImpl(
        newState,
        action as SelectSourceForMeasureAction,
      );
      return newState;
    case MeasureSettingsActionTypes.DeselectSourceForMeasure:
      deselectSourceForMeasureImpl(
        newState,
        action as DeselectSourceForMeasureAction,
      );
      return newState;
    case MeasureSettingsActionTypes.SetUnitType:
      setUnitTypeImpl(newState, action as SetUnitTypeAction)
      return newState;
    default:
      return state;
  }
};

export function getSourceSelectionInfo(
  measureSpec: MeasureSpec,
  state: MeasureSettingsState,
): SourceSelectionInfo {
  const f = state.selectionInfoList.find(
    el => el.measureSpecKey === measureSpec.nameKey,
  );
  if (f) {
    return f.sourceSelectionInfo;
  } else return null;
}

function setSourceSelectionInfo(
  measureSpec: MeasureSpec,
  selectionInfo: SourceSelectionInfo,
  state: MeasureSettingsState,
) {
  const match = state.selectionInfoList.find(
    el => el.measureSpecKey === measureSpec.nameKey,
  );
  if (match) {
    match.sourceSelectionInfo = selectionInfo;
  } else {
    state.selectionInfoList.push({
      measureSpecKey: measureSpec.nameKey,
      sourceSelectionInfo: selectionInfo,
    });
  }
}

function selectSourceForMeasureImpl(
  state: MeasureSettingsState,
  action: SelectSourceForMeasureAction,
) {
  let selectionInfo: SourceSelectionInfo = getSourceSelectionInfo(
    action.measure.spec,
    state,
  );

  if (selectionInfo) {
    const selectedIndex = selectionInfo.connectedMeasureCodes.indexOf(
      action.measure.code,
    );
    if (selectedIndex >= 0) {
      if (action.setMainIfNot === true) {
        selectionInfo.mainIndex = selectedIndex;
      }
    } else {
      selectionInfo.connectedMeasureCodes.push(action.measure.code);
      if (action.setMainIfNot === true) {
        selectionInfo.mainIndex =
          selectionInfo.connectedMeasureCodes.length - 1;
      }
    }
  } else {
    selectionInfo = {
      connectedMeasureCodes: [action.measure.code],
      mainIndex: 0,
    };
  }

  setSourceSelectionInfo(action.measure.spec, selectionInfo, state);

  return state;
}

function deselectSourceForMeasureImpl(
  state: MeasureSettingsState,
  action: DeselectSourceForMeasureAction,
) {
  let selectionInfo: SourceSelectionInfo = getSourceSelectionInfo(
    action.measure.spec,
    state,
  );

  if (selectionInfo) {
    const index = selectionInfo.connectedMeasureCodes.indexOf(
      action.measure.code,
    );
    if (index >= 0) {
      const deactivated = true;
      if (deactivated === true) {
        selectionInfo.connectedMeasureCodes.splice(index, 1);
        if (selectionInfo.connectedMeasureCodes.length === 0) {
          const matchIndex = state.selectionInfoList.findIndex(
            el => el.measureSpecKey === action.measure.spec.nameKey,
          );
          state.selectionInfoList.splice(matchIndex, 1);
        } else {
          if (selectionInfo.mainIndex === index) {
            //set another one as main
            if (selectionInfo.connectedMeasureCodes.length > index) {
              selectionInfo.mainIndex = index;
            } else selectionInfo.mainIndex = index - 1;
          } else if (selectionInfo.mainIndex > index) {
            selectionInfo.mainIndex--;
          }

          setSourceSelectionInfo(action.measure.spec, selectionInfo, state);
        }
      }
    }
  } else return;
}

function setUnitTypeImpl(
  state: MeasureSettingsState,
  action: SetUnitTypeAction
){
  state.unit = action.unitType
}
