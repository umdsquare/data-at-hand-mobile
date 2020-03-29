import {Sizes} from './Sizes';
import {StyleSheet, Platform} from 'react-native';
import Colors from './Colors';

const StyleTemplates = StyleSheet.create({

  backPanelBackgroundColor: {
    backgroundColor: Colors.backPanelColor
  },

  screenDefaultStyle: {
    flex: 1,
    alignSelf: 'stretch',
  },

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
    elevation: 2,
  },

  androidCardPanelStyle: {
    margin: 0,
    marginTop: 2,
    marginBottom: 8,
    borderWidth: 0,
    elevation: 2,
  },

  titleTextStyle: {
    fontSize: Sizes.titleFontSize,
    fontWeight: 'bold',
    color: Colors.textColorDark,
  },

  subTitleTextStyle: {
    fontSize: Sizes.subtitleFontSize,
    fontWeight: 'bold',
    color: Colors.textColorDark,
  },

  hugeTitleTextStyle: {
    fontSize: Sizes.hugeTitleFontSize,
    fontWeight: 'bold',
    color: Colors.textColorDark,
  },

  descriptionTextStyle: {
    fontSize: Sizes.descriptionFontSize,
    color: Colors.textColorLight,
  },

  headerRightTextButtonStyle: {},

  headerTitleStyle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },

  dataSourceCardHeaderTitleStyle: {
    fontSize: Sizes.normalFontSize,
    fontWeight: 'bold',
    color: Colors.textColorLight,
  },

  dataSourceChartDefaultTextStyle: {
    fontSize: Sizes.tinyFontSize,
    fontWeight: 'normal',
    color: Colors.chartElementDefault,
  },

  dataSourceChartSummaryTitleStyle: {
    color: Colors.chartLightText,
    fontSize: Sizes.tinyFontSize,
  },

  dataSourceChartSummaryValueStyle: {
    color: Colors.chartDimmedText,
    fontSize: Sizes.smallFontSize,
    fontWeight: '600',
  },

  fitParent: { left: 0, right: 0, top: 0, bottom: 0, position: 'absolute' },

  bottomSheetModalContainerStyle: {
    flexDirection: 'row', margin: 0,
    elevation: 10,
  },

  bottomSheetModalViewStyle: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.WHITE,
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
  },

  fillFlex: {
    flex: 1,
  },

  flexHorizontalCenteredListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentVerticalCenteredContainer: {flex: 1, justifyContent: 'center'},

  wheelPickerCommonStyle: {
      height: Platform.OS === 'ios' ? undefined : 150,
  }
});

export {StyleTemplates};
