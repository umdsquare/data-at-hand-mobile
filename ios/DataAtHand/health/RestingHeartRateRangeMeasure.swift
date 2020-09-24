//
//  RestingHeartRateRangeMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class RestingHeartRateRangeMeasure : DataSourceDailySummaryMeasureBase {
  init(){
    super.init(HKQuantityTypeIdentifier.restingHeartRate, HKStatisticsOptions.discreteAverage)
  }
  
  override func getValueFromDayLevelStatistics(_ stat: HKStatistics) -> Double?{
    return stat.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
  }
  
  override func makeStatistics(_ min: Double?, _ max: Double?, _ sum: Double?, _ avg: Double?) -> Any? {
      return [
        ["type": "avg", "value": avg],
        ["type": "range", "value": [min, max]]
    ]
  }
}
