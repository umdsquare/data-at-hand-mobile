//
//  SleepMeasureBase.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/23/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit


struct MainSleepLog{
  
  var lengthInSeconds: Int;
  var bedTimeDiffSeconds: Int;
  var wakeTimeDiffSeconds: Int;
  var numberedDate: Int;
  var year: Int;
  var month: Int;
  var dayOfWeek: Int;
  
  func toDictionary() -> NSDictionary {
    return [
      "lengthInSeconds": self.lengthInSeconds,
      "bedTimeDiffSeconds": self.bedTimeDiffSeconds,
      "wakeTimeDiffSeconds": self.wakeTimeDiffSeconds,
      "numberedDate": self.numberedDate,
      "year": self.year,
      "month": self.month,
      "dayOfWeek": self.dayOfWeek
    ]
  }
}

class SleepRangeMeasureBase : DataSourceRangeMeasureBase {
  
  static let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
  
  static let previousDateInterval = TimeInterval(-24*60*60)
  
  static func getMainSleepLogs (_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (_ error: Error?, _ result: [MainSleepLog]?)->Void) -> Void {
    
    let fromDate = HealthKitManager.convertNumberedDateToDate(start)
    let toDate = Calendar.current.startOfDay(for: HealthKitManager.convertNumberedDateToDate(end)).addingTimeInterval(TimeInterval(24*60*60))
    
    let predicate = HKQuery.predicateForSamples(withStart: fromDate.addingTimeInterval(previousDateInterval), end: toDate, options: [.strictStartDate, .strictEndDate])
    
    let query = HKSampleQuery(sampleType: type, predicate: predicate,
                              limit: Int(HKObjectQueryNoLimit),
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  
                                  if (results?.count ?? 0) > 0 {
                                    
                                    //UUID: NumberedDate
                                    var mainSleepUuids: [String: Int] = [:]
                                    
                                    var mainSleeps: [MainSleepLog] = []
                                    
                                    var comp = DateComponents.init()
                                    comp.hour = 0
                                    comp.minute = 0
                                    comp.second = 0
                                    comp.nanosecond = 0
                                    
                                    Calendar.current.enumerateDates(startingAfter: fromDate.addingTimeInterval(previousDateInterval), matching: comp, matchingPolicy: Calendar.MatchingPolicy.nextTime, repeatedTimePolicy: Calendar.RepeatedTimePolicy.first, direction: Calendar.SearchDirection.forward) { (date, exact, stop) in
                                      
                                      if(date != nil){
                                        let numberedDate = HealthKitManager.convertDateToNumberedDate(date!)
                                        
                                        let previousDate = date!.addingTimeInterval(TimeInterval(-12*60*60))
                                        let endOfDay = date!.addingTimeInterval(TimeInterval(24*60*60))
                                        
                                        let inBedLogs = results!.filter { (sample) -> Bool in
                                          let sleepSample = sample as! HKCategorySample
                                          return mainSleepUuids[sleepSample.uuid.uuidString] == nil && sleepSample.value == HKCategoryValueSleepAnalysis.inBed.rawValue && sample.startDate >= previousDate && sample.endDate <= endOfDay
                                        }
                                                                                
                                        var mainSleepSample: HKCategorySample? = nil
                                        if(inBedLogs.count == 1){
                                          mainSleepSample = inBedLogs.first as? HKCategorySample
                                        } else if (inBedLogs.count > 1) {
                                          mainSleepSample = inBedLogs.max { (a, b) -> Bool in
                                            let intervalA = a.endDate.timeIntervalSince(a.startDate)
                                            let intervalB = b.endDate.timeIntervalSince(b.startDate)
                                            return intervalA <= intervalB
                                          } as? HKCategorySample
                                        }
                                        
                                        if(mainSleepSample != nil){
                                          mainSleepUuids[mainSleepSample!.uuid.uuidString] = numberedDate
                                          
                                          
                                          //make log
                                          let components = Calendar.current.dateComponents([.year, .month, .weekday], from: date!)
                                          
                                          let asleeps = results!.filter { (sample) -> Bool in
                                            let sleepSample = sample as! HKCategorySample
                                            return sleepSample.value == HKCategoryValueSleepAnalysis.asleep.rawValue && sleepSample.startDate >= mainSleepSample!.startDate && sleepSample.endDate <= mainSleepSample!.endDate
                                          }
                                          
                                          mainSleeps.append(MainSleepLog(lengthInSeconds: Int(asleeps.reduce(into: 0, { (result, sample) in
                                            result += sample.endDate.timeIntervalSince(sample.startDate)
                                          })),
                                          bedTimeDiffSeconds: Int(mainSleepSample!.startDate.timeIntervalSince(date!)),
                                          wakeTimeDiffSeconds: Int(mainSleepSample!.endDate.timeIntervalSince(date!)),
                                          numberedDate: numberedDate,
                                          year: components.year!,
                                          month: components.month!,
                                          dayOfWeek: components.weekday! - 1))
                                        }
                                        
                                        if(numberedDate >= end){
                                          stop = true
                                        }
                                      }else{
                                        stop = true
                                      }
                                    }
                                    
                                    callback(nil, mainSleeps)
                                  }else{
                                    callback(nil, [])
                                  }
                                } else{
                                  callback(error, nil)
                                }
                              })
    
    store.execute(query)
  }
  
  override func getTodayValue(_ store: HKHealthStore, completion onComplete: @escaping (Any?) -> Void){
    let today = HealthKitManager.convertDateToNumberedDate(Date())
    
    SleepRangeMeasureBase.getMainSleepLogs(store, start: today, end: today) { (error, logs) in
      if(error == nil){
        if(logs!.count > 0){
          onComplete(self.getTodayValueFromLog(logs!.first!))
        }else{
          onComplete(nil)
        }
      } else {
        onComplete(nil)
      }
    }
  }
  
  func getTodayValueFromLog(_ log: MainSleepLog) -> Any{
    preconditionFailure("Implement this function")
  }
  
  override func queryDayLevelMetricData(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Any?)->Void){
    SleepRangeMeasureBase.getMainSleepLogs(store, start: start, end: end) { (error, sleepLogs) in
      if(error != nil){
        callback(nil)
      }else{
        callback(sleepLogs!.map { (log) -> NSDictionary in
          return log.toDictionary()
        })
      }
    }
  }
  
}
