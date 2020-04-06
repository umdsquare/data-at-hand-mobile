'use strict';

import { Platform, Dimensions, PixelRatio } from "react-native";

const window = Dimensions.get('window')
const screenWidth = window.width

const GUIDELINE_WIDTH = 380; // ~5.5 inch screen width

//iPhone 6: 375
//iPhone Xr: 414
//Pixel 3a: 392
//Galaxy J7: 360

export function sizeByScreen(normal:number, small?: number): number{
    if(screenWidth >= GUIDELINE_WIDTH) return normal
        else return small
}



export const Sizes = {
    navHeaderSize: Platform.OS ==='ios'? 56 : 60,

    horizontalPadding: 16,
    verticalPadding: Platform.OS === 'ios'? 16 : 12,

    hugeTitleFontSize: 28,
    BigFontSize: 22,
    titleFontSize: 20,
    subtitleFontSize: 18,
    descriptionFontSize: 14,

    normalFontSize: Platform.OS === 'ios'? sizeByScreen(16, 14.5) : 16,
    smallFontSize: Platform.OS === 'ios'? sizeByScreen(14, 12.5) : 14,
    tinyFontSize: Platform.OS === 'ios'? sizeByScreen(12, 11) : 12,

    tinyTextButtonHeight: 36,

    speechInputButtonSize: 58
};