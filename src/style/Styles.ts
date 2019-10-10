import {Sizes} from './Sizes';
import { StyleProp, TextStyle } from 'react-native';
import Colors from './Colors';

const StyleTemplates = {
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
  },

  titleTextStyle: {
    fontSize: Sizes.titleFontSize,
    fontWeight: "bold",
    color: Colors.textColorDark
  }as StyleProp<TextStyle>,

  descriptionTextStyle: {
    fontSize: Sizes.descriptionFontSize,
    color: Colors.textColorLight
  }as StyleProp<TextStyle>

};

export {StyleTemplates};
