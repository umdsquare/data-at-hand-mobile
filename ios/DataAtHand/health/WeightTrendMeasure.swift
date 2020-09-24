//
//  WeightTrendMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class WeightTrendMeasure : DataSourceDailySummaryMeasureBase {
  init(){
    super.init(HKQuantityTypeIdentifier.bodyMass, HKStatisticsOptions.discreteAverage)
  }
  
  override func getValueFromDayLevelStatistics(_ stat: HKStatistics) -> Double?{
    return stat.averageQuantity()?.doubleValue(for: .gramUnit(with: .kilo))
  }
}
