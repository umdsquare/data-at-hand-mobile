/**
 * @format
 */

import { preprocess } from '@core/speech/nlp/preprocessor';
import { dataSources, speechOptions } from '../jest.setup';
import { VariableType, CyclicTimeFrame } from '@data-at-hand/core';

/*it('renders correctly', () => {
  renderer.create(<App />);
});*/

const expressions = [
  ["Show by month", CyclicTimeFrame.MonthOfYear],
  ["Show by month of the year", CyclicTimeFrame.MonthOfYear],
  ["Show by months of the year", CyclicTimeFrame.MonthOfYear],
  ["Show the monthly pattern", CyclicTimeFrame.MonthOfYear],
  ["Show monthly", CyclicTimeFrame.MonthOfYear],
  
  ["Show by day of the week", CyclicTimeFrame.DayOfWeek],
  ["Show by days of the week", CyclicTimeFrame.DayOfWeek],
  ["Show by days of week", CyclicTimeFrame.DayOfWeek],
  ["Show by day of week", CyclicTimeFrame.DayOfWeek],
  ["Show by day of the week pattern", CyclicTimeFrame.DayOfWeek],
  ["Get me the weekly pattern", CyclicTimeFrame.DayOfWeek], 
  ["Weekly pattern", CyclicTimeFrame.DayOfWeek],
  ["Get me the Weekly data", CyclicTimeFrame.DayOfWeek],
  ["Weekly data", CyclicTimeFrame.DayOfWeek],
  ["Yearly data", CyclicTimeFrame.MonthOfYear],
  ["Yearly pattern", CyclicTimeFrame.MonthOfYear],
  ["Get me the yearly data", CyclicTimeFrame.MonthOfYear],
  ["Get me the yearly pattern", CyclicTimeFrame.MonthOfYear],
]


describe("Cyclic Time Frames", () => {
  expressions.forEach(r => {
    it(r[0], async () => {
      const result = await preprocess(r[0], speechOptions)

      const cycleId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.TimeCycle)
      expect(result.variables[cycleId].type).toBe(VariableType.TimeCycle)
      expect(result.variables[cycleId].value).toEqual(r[1])
    });
  })
})