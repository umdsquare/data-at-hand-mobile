import React from 'react';
import {Text, View} from 'react-native';
import { Sizes } from '../../../style/Sizes';
import { ButtonGroup } from 'react-native-elements';
import { MeasureUnitType } from '../../../measure/MeasureSpec';
import { Dispatch } from 'redux';
import { AppState } from '../../../state/types';
import { connect } from 'react-redux';
import Colors from '../../../style/Colors';
import { setUnit } from '../../../state/measure-settings/actions';

interface Props{
    selectedUnitType?: MeasureUnitType,
    setUnitType?: (index)=>void
}

class ConfigurationPanel extends React.Component<Props>{

    static UnitTypes = [{
        key: MeasureUnitType.Metric,
        label: 'Metric'
    }, {
        key: MeasureUnitType.US,
        label: "US Standard"
    }]

    onPressUnitConfigButton = (index)=>{this.props.setUnitType(index)}

    render(){
        return (
        <View style={{paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{marginRight: 8, fontSize: Sizes.subtitleFontSize}}>Units</Text>
            <ButtonGroup 
                buttons={ConfigurationPanel.UnitTypes.map(tu => tu.label)} 
                selectedIndex={ConfigurationPanel.UnitTypes.findIndex(tu => tu.key === this.props.selectedUnitType)}
                containerStyle={{
                    borderRadius: 8,
                    borderColor: Colors.accent,
                    borderWidth: 2,
                    flex: 1
                }}
                buttonStyle = {{
                    backgroundColor: 'transparent',
                }}
                selectedButtonStyle={{
                    backgroundColor: Colors.accent
                }}
                textStyle={{
                    color: Colors.lightFormBackground
                }}
                selectedTextStyle={{
                    fontWeight: 'bold'
                }}
                onPress={this.onPressUnitConfigButton}></ButtonGroup>
            </View>
        </View>)
    }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props{
    return {...ownProps,
        setUnitType: (index) => dispatch(setUnit(ConfigurationPanel.UnitTypes[index].key))
    }
}

function mapStateToProps(appState: AppState, ownProps: Props): Props{
    return {
        ...ownProps,
        selectedUnitType: appState.measureSettingsState.unit
    }
}

const connectedComponent = connect(mapStateToProps, mapDispatchToProps)(ConfigurationPanel)
export { connectedComponent as ConfigurationPanel }