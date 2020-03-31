import React from 'react';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
export const TodayContext = React.createContext<number>(DateTimeHelper.toNumberedDateFromDate(new Date()))