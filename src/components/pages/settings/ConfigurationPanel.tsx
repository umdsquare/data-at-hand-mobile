import React from 'react';
import {Text, View} from 'react-native';
import { Sizes } from '../../../style/Sizes';
import { ButtonGroup } from 'react-native-elements';
import { MeasureUnitType } from '../../../measure/MeasureSpec';
import { Dispatch } from 'redux';
import { AppState } from '../../../state/types';
import { connect } from 'react-redux';
import Colors from '../../../style/Colors';
import { StyleTemplates } from '../../../style/Styles';
import { setUnit } from '../../../state/measure-settings/actions';

interface Props{
    selectedUnitType: MeasureUnitType,
    setUnitType: (index)=>{}
}

class ConfigurationPanel extends React.Component<Props>{

    static UnitTypes = [{
        key: MeasureUnitType.Metric,
        label: 'Metric'
    }, {
        key: MeasureUnitType.US,
        label: "US Standard"
    }]

    render(){
        return (
        <View style={{paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding}}>
            <Text style={StyleTemplates.subTitleTextStyle}>Units</Text>
            <ButtonGroup 
                buttons={ConfigurationPanel.UnitTypes.map(tu => tu.label)} 
                selectedIndex={ConfigurationPanel.UnitTypes.findIndex(tu => tu.key === this.props.selectedUnitType)}
                containerStyle={{
                    borderRadius: 8,
                    borderColor: Colors.accent,
                    borderWidth: 2,
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
                onPress={(index)=>{this.props.setUnitType(index)}}></ButtonGroup>
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