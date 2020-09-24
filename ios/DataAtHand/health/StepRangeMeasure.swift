//
//  StepRangeMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class StepRangeMeasure : DataSourceDailySummaryMeasureBase{
  
  init(){
    super.init(HKQuantityTypeIdentifier.stepCount, HKStatisticsOptions.cumulativeSum)
  }
  
  override func getValueFromDayLevelStatistics(_ stat: HKStatistics) -> Double?{
    let value = stat.sumQuantity()?.doubleValue(for: .count())
    if value != nil {
      return round(value!)
    } else {
      return nil
    }
  }
}
