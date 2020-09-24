//
//  HoursSleptRangeMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/24/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class HoursSleptRangeMeasure : SleepRangeMeasureBase {
  
  override func getPreferredValueRange(_ store: HKHealthStore, completion onComplete: @escaping (_ error: Error?, _ result: [Double?]) -> Void){
    onComplete(nil, [nil, nil])
  }
  override func getTodayValueFromLog(_ log: MainSleepLog) -> Any {
    return log.lengthInSeconds
  }
  
  
  override func getStatistics(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (_ error: Error?, _ result: Any?)->Void){
    
    SleepRangeMeasureBase.getMainSleepLogs(store, start: start, end: end) { (error, logs) in
      if(error == nil){
        
        if(logs!.count > 0){
          
          var minValue: Int? = nil
          var maxValue: Int? = nil
          var sum: Int? = nil
          var length: Int = 0
          
          logs!.forEach { (log) in
            let value: Int = log.lengthInSeconds
            
            if minValue != nil {
              minValue = min(minValue!, value)
            }else {
              minValue = value
            }
            
            if maxValue != nil{
              maxValue = max(maxValue!, value)
            }else{
              maxValue = value
            }
            
            if sum != nil{
              sum = sum! + value
            } else {
              sum = value
            }
            
            length = length + 1
          }
          
          callback(nil, [
            ["type": "avg", "value": sum != nil ? Double(sum!)/Double(length) : nil],
            ["type": "range", "value": [minValue, maxValue]]
          ])
        }else{
          callback(nil, [
            ["type": "avg", "value": nil],
            ["type": "range", "value": [nil, nil]]
          ])
        }
        
        
      }else{
        callback(error, nil)
      }
    }
  }
  
}
