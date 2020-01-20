'use strict';

import { Platform } from "react-native";

const Sizes = {
    navHeaderSize: Platform.OS ==='ios'? 56 : 60,

    horizontalPadding: 16,
    verticalPadding: 12,

    hugeTitleFontSize: 28,
    BigFontSize: 22,
    titleFontSize: 20,
    subtitleFontSize: 18,
    descriptionFontSize: 14,

    normalFontSize: 16,
    smallFontSize: 14,
    tinyFontSize: 12,

    speechInputButtonSize: 58
};

export { Sizes }