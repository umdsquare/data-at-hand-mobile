//
//  SleepRangeRangeMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/24/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class SleepRangeRangeMeasure : SleepRangeMeasureBase {
  
  override func getPreferredValueRange(_ store: HKHealthStore, completion onComplete: @escaping (_ error: Error?, _ result: [Double?]) -> Void){
    onComplete(nil, [nil, nil])
  }
  override func getTodayValueFromLog(_ log: MainSleepLog) -> Any {
    return [log.bedTimeDiffSeconds, log.wakeTimeDiffSeconds]
  }
  
  
  override func getStatistics(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (_ error: Error?, _ result: Any?)->Void){
    
    SleepRangeMeasureBase.getMainSleepLogs(store, start: start, end: end) { (error, logs) in
      if error == nil {
        if(logs!.count > 0){
          
          let wakeTimeAvg = logs!.reduce(into: 0) { (result, log) in
            result += log.wakeTimeDiffSeconds
          } / logs!.count
          
          let bedtimeAvg = logs!.reduce(into: 0) { (result, log) in
            result += log.bedTimeDiffSeconds
          } / logs!.count
          
          
          callback(nil, [
            ["type": "bedtime", "value": bedtimeAvg],
            ["type": "waketime", "value": wakeTimeAvg],
          ])
        }else {
          callback(nil, [
            ["type": "bedtime", "value": nil],
            ["type": "waketime", "value": nil],
          ])
        }
      } else {
        callback(error, [
          nil
        ])
      }
    }
  }
  
}
