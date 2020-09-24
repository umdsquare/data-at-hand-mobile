//
//  DataSourceMeasureBase.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit


class DataSourceRangeMeasureBase {
  
  init(){
    
  }
  
  func getPreferredValueRange(_ store: HKHealthStore, completion onComplete: @escaping (_ error: Error?, _ result: [Double?]) -> Void){
    preconditionFailure("Implement this function")
  }
  
  func getTodayValue(_ store: HKHealthStore, completion onComplete: @escaping (Any?) -> Void){
    preconditionFailure("Implement this function")
  }
  
  func queryDayLevelMetricData(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Any?)->Void){
    preconditionFailure("Implement this function")
  }
  
  func getStatistics(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (_ error: Error?, _ result: Any?)->Void){
    preconditionFailure("Implement this function")
  }
  
}
