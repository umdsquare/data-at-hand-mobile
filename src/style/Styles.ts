import {Sizes} from './Sizes';
import { StyleSheet } from 'react-native';
import Colors from './Colors';

const StyleTemplates = StyleSheet.create({
  styleWithHorizontalPadding: {
    paddingLeft: Sizes.horizontalPadding,
    paddingRight: Sizes.horizontalPadding,
  },
  styleWithVerticalPadding: {
    paddingTop: Sizes.verticalPadding,
    paddingBottom: Sizes.verticalPadding,
  },

  buttonGroupStyle: {
    borderRadius: 6,
    borderWidth: 2,
  },

  backgroundCardStyle: {
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2
  },

  androidCardPanelStyle: {
    margin: 0,
    marginTop: 2,
    marginBottom: 8,
    borderWidth: 0,
    elevation: 2
  },

  titleTextStyle: {
    fontSize: Sizes.titleFontSize,
    fontWeight: "bold",
    color: Colors.textColorDark
  },

  subTitleTextStyle: {
    fontSize: Sizes.subtitleFontSize,
    fontWeight: "bold",
    color: Colors.textColorDark
  },


  hugeTitleTextStyle: {
    fontSize: Sizes.hugeTitleFontSize,
    fontWeight: "bold",
    color: Colors.textColorDark
  },

  descriptionTextStyle: {
    fontSize: Sizes.descriptionFontSize,
    color: Colors.textColorLight
  },

  headerRightTextButtonStyle: {
    
  },

  dataSourceCardHeaderTitleStyle: {
    fontSize: Sizes.normalFontSize,
    fontWeight: "bold",
    color: Colors.textColorLight
  },

  dataSourceChartDefaultTextStyle: {
    fontSize: Sizes.tinyFontSize,
    fontWeight: "normal",
    color: Colors.chartElementDefault
  },

  dataSourceChartSummaryTitleStyle: {
    color: Colors.chartLightText,
    fontSize: Sizes.tinyFontSize
  },

  dataSourceChartSummaryValueStyle: {
    color: Colors.chartDimmedText,
    fontSize: Sizes.smallFontSize,
    fontWeight: "600",
  }

  

})

export {StyleTemplates};