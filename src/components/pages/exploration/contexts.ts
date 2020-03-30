import React from 'react';
import { DateTimeHelper } from '@utils/time';
export const TodayContext = React.createContext<number>(DateTimeHelper.toNumberedDateFromDate(new Date()))