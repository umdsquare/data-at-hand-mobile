//
//  HealthKitManager.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 10/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import HealthKit

struct RangeLog{
  var startedAt: Int
  var endedAt: Int
}

struct SleepAnalysisLog{
  let type: String
  let startedAt: Int
  let endedAt: Int
}

struct MergedSleepLog{
  var startedAt: Int
  var endedAt: Int
  var mergedAsleeps: [RangeLog]
  
  func toDictionary() -> NSDictionary {
    return [
      "startedAt": self.startedAt,
      "endedAt": self.endedAt,
      "efficiency": Double(self.mergedAsleeps.reduce(0, { (currentResult, asleepLog) in
        return currentResult + (asleepLog.endedAt - asleepLog.startedAt)
      })) / Double(self.endedAt - self.startedAt),
      "mergedAsleeps": self.mergedAsleeps.map{ asleepLog in
        return ["startedAt": asleepLog.startedAt, "endedAt": asleepLog.endedAt]
      }
    ]
  }
}

enum DailyAggregationType{
  case sum, average
}

@objc(HealthKitManager)
class HealthKitManager: NSObject{
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  static func convertDateToUnix(_ date: Date) -> Int{
    return Int(date.timeIntervalSince1970*1000)
  }
  
  static func convertNumberedDateToDate(_ numberedDate: Int) -> Date{
    let year = numberedDate / 10000
    let month = (numberedDate % 10000)/100
    let day = numberedDate % 100
    
    var components = DateComponents()
    components.year = year
    components.month = month
    components.day = day
    return Calendar.current.date(from: components)!
  }
  
  static func convertDateToNumberedDate(_ date: Date) -> Int{
    let components = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return components.year! * 10000 + components.month! * 100 + components.day!
  }
  
  static func querySamples(_ store: HKHealthStore, start: Int, end: Int, type: HKSampleType,
                            convert: @escaping (HKSample)->Any,
                            postprocess: (([Any])->[NSDictionary])?,
                            completion callback: @escaping ([Any]?)->Void){
    let fromDate = HealthKitManager.convertNumberedDateToDate(start)
    let toDate = Calendar.current.startOfDay(for: HealthKitManager.convertNumberedDateToDate(end)).addingTimeInterval(TimeInterval(24*60*60))
    
    let predicate = HKQuery.predicateForSamples(withStart: fromDate, end: toDate, options: [.strictStartDate, .strictEndDate])
    
    
    let query = HKSampleQuery(sampleType: type, predicate: predicate,
                              limit: Int(HKObjectQueryNoLimit),
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  let convertedResult = results!.map({ (sample) in
                                    return convert(sample)
                                  })
                                  
                                  if postprocess != nil {
                                    let dispatchQueue = DispatchQueue(label: "PostProcess", qos: .background)
                                    dispatchQueue.async {
                                      let processed = postprocess!(convertedResult)
                                      callback(processed)
                                    }
                                  }else { callback(convertedResult) }
                                } else{
                                    print(error.debugDescription)
                                    callback(nil)
                                }
    })
    
    store.execute(query)
  }
  
  
  static var permissionSet = Set([
    HKObjectType.quantityType(forIdentifier: .heartRate)!,
    HKObjectType.quantityType(forIdentifier: .stepCount)!,
    HKObjectType.quantityType(forIdentifier: .bodyMass)!,
    HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
    HKObjectType.quantityType(forIdentifier: .restingHeartRate)!
  ])
  
  private let dateFormatter = DateFormatter()
  
  private var _healthStore: HKHealthStore? = nil
  func getHealthStore() -> HKHealthStore{
    if(_healthStore != nil){
      return _healthStore!
    }else{
      _healthStore = HKHealthStore()
      return _healthStore!
    }
  }
  
  private var dayLevelMeasures: [NSString: DataSourceRangeMeasureBase]
  
  override init(){
    dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZ"
        
    dayLevelMeasures = [
      "step_count": StepRangeMeasure(),
      "weight": WeightRangeMeasure(),
      "heart_rate": RestingHeartRateRangeMeasure(),
      "sleep_duration": HoursSleptRangeMeasure(),
      "sleep_range": SleepRangeRangeMeasure()
    ]
  }
  
  deinit {
    
  }
  
  @objc
  func isAvailableInSystem(_ callback: RCTResponseSenderBlock) -> Void{
    callback([NSNull(), ["available": HKHealthStore.isHealthDataAvailable()]])
  }
  
  @objc
  func requestPermissions(_ callback: @escaping RCTResponseSenderBlock) -> Void{
    
    getHealthStore().requestAuthorization(toShare: nil, read: HealthKitManager.permissionSet, completion: {(success, error) in
      if !success {
        print(error?.localizedDescription)
        callback([NSNull(), ["approved": false]])
      }else{
        //process successed, but check again to make sure the permissions were actually granted.
        callback([NSNull(), ["approved": true]])
      }}
    )
  }
  
  private func firstDateOfSource(_ dataSourceType: HKSampleType, callback: @escaping (Int?)->Void) -> Void{
    let calendar = Calendar.current
    let fromDate = getHealthStore().earliestPermittedSampleDate()
    let toDate = calendar.startOfDay(for: Date()).addingTimeInterval(TimeInterval(24*60*60))
    let predicate = HKQuery.predicateForSamples(withStart: fromDate, end: toDate, options: [.strictStartDate, .strictEndDate])
    
    
    let query = HKSampleQuery(sampleType: dataSourceType, predicate: predicate,
                              limit: 1,
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  if (results?.count ?? 0) > 0 {
                                    callback(HealthKitManager.convertDateToNumberedDate(results!.first!.startDate))
                                  }else{
                                    callback(nil)
                                  }
                                } else{
                                  callback(nil)
                                }
    })
    
    getHealthStore().execute(query)
  }
  
  
  @objc
  func getInitialTrackingDate(_ callback: @escaping RCTResponseSenderBlock) -> Void{
    
    print("get initial tracking date ")
    
    let types = [
      HKObjectType.quantityType(forIdentifier: .heartRate)!,
      HKObjectType.quantityType(forIdentifier: .stepCount)!,
      HKObjectType.quantityType(forIdentifier: .bodyMass)!,
      HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
    ]
    
    let group = DispatchGroup()
    let queue = DispatchQueue.global(qos: .background)
    
    var minimumInitialDate: Int?
    
    types.forEach { (type: HKSampleType) in
      group.enter()
      queue.async {
        self.firstDateOfSource(type) { (initialDate: Int?) in
          if minimumInitialDate == nil{
            minimumInitialDate = initialDate
          } else if initialDate != nil{
            minimumInitialDate = min(minimumInitialDate!, initialDate!)
          }
          
          group.leave()
        }
      }
    }
    
    group.notify(queue: queue){
      callback([NSNull(), ["initialDate": minimumInitialDate]])
    }
  }
  
  @objc
  func getPreferredValueRange(_ source: NSString, completion callback: @escaping RCTResponseSenderBlock) -> Void{
    self.dayLevelMeasures[source]?.getPreferredValueRange(getHealthStore(), completion: { (error: Error?, range) in
      callback([error?.localizedDescription, range])
    }) ?? callback([NSNull(), [nil, nil]])
  }
  
  @objc
  func queryDailySummaryData(_ start: NSInteger, end: NSInteger, source: NSString, includeStatistics: Bool, includeToday: Bool, completion callback: @escaping RCTResponseSenderBlock) -> Void{
        
    let queryDispatchGroup = DispatchGroup.init()
        
    var data: Any?
    var todayValue: Any? = nil
    var statistics: Any? = nil
        
    let measure = self.dayLevelMeasures[source]
    
    if(measure != nil){
      queryDispatchGroup.enter()
      measure!.queryDayLevelMetricData(getHealthStore(), start: start, end: end, completion: { (result) in
      data = result
      queryDispatchGroup.leave()
      })
      
      if includeToday == true {
        queryDispatchGroup.enter()
        measure!.getTodayValue(getHealthStore()) { (result) in
          todayValue = result
          queryDispatchGroup.leave()
        }
      }
      
      if includeStatistics == true {
        queryDispatchGroup.enter()
        measure!.getStatistics(getHealthStore(), start: start, end: end) { (error: Error?, result: Any?) in
          if(error == nil){
            statistics = result
          }else{
            print(error?.localizedDescription)
          }
          queryDispatchGroup.leave()
        }
      }
    }else {
      data = []
    }
    
    
        
    queryDispatchGroup.notify(queue: DispatchQueue.main) {
            
      callback([NSNull(), [
        "source": source,
        "range": [start, end],
        "data": data,
        "today": todayValue,
        "statistics": statistics
        ]])
    }
        
  }
  
  
  /*
  @objc
  func queryIntradayData(_ date: Int, type: String, completion callback: @escaping RCTResponseSenderBlock) -> Void{
    let dateDate = HealthKitManager.convertNumberedDateToDate(date)
    switch type {
    case "step":
      queryHourlySteps(numberedDate: date, completion: callback)
      break;
    case "heart_rate":
      querySamples(start: date, end: date, type: HKObjectType.quantityType(forIdentifier: .heartRate)!, convert: { (sample) in
        let qSample = sample as! HKQuantitySample
        return [
          "secondOfDay": Int(qSample.startDate.timeIntervalSince1970 - dateDate.timeIntervalSince1970),
          "value": Int(round(qSample.quantity.doubleValue(for: self.bpmUnit)))
        ]
      }, postprocess: nil, completion: callback)
      break;
    case "sleep":
      break;
    default:
      callback([["error": "UnsupportedDataType"], NSNull()])
      break;
    }
  }
  
  
  private func queryHourlySteps(numberedDate: Int, completion callback: @escaping RCTResponseSenderBlock){
    var interval = DateComponents()
    interval.hour = 1
    
    let date = HealthKitManager.convertNumberedDateToDate(numberedDate)
    let dateEnd = Calendar.current.startOfDay(for: date).addingTimeInterval(TimeInterval(24*60*60))
    
    let query = HKStatisticsCollectionQuery(
      quantityType: HKObjectType.quantityType(forIdentifier: .stepCount)!,
      quantitySamplePredicate: nil,
      options: HKStatisticsOptions.cumulativeSum,
      anchorDate: date, intervalComponents: interval)
    
    query.initialResultsHandler = {
      query, results, error in
      
      if error == nil {
        var dataList: [[String:Any]] = []
        results?.enumerateStatistics(from: date, to: dateEnd, with: {(datum, stop) in
          
          let components = Calendar.current.dateComponents([.hour], from: datum.startDate)
          dataList.append(
            [
              "hourOfDay": components.hour!,
              "value": Int(round(datum.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0))
            ]
          )
        })
        callback([NSNull(), dataList])
      } else {
        callback([["error": error?.localizedDescription], NSNull()])
      }
    }
    
    getHealthStore().execute(query)
  }

  
  
  private func querySamples(start: Int, end: Int, type: HKSampleType,
                            convert: @escaping (HKSample)->Any,
                            postprocess: (([Any])->[NSDictionary])?,
                            completion callback: @escaping ([Any]?)->Void){
    let fromDate = HealthKitManager.convertNumberedDateToDate(start)
    let toDate = Calendar.current.startOfDay(for: HealthKitManager.convertNumberedDateToDate(end)).addingTimeInterval(TimeInterval(24*60*60))
    
    let predicate = HKQuery.predicateForSamples(withStart: fromDate, end: toDate, options: [.strictStartDate, .strictEndDate])
    
    
    let query = HKSampleQuery(sampleType: type, predicate: predicate,
                              limit: Int(HKObjectQueryNoLimit),
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  let convertedResult = results!.map({ (sample) in
                                    return convert(sample)
                                  })
                                  
                                  if postprocess != nil {
                                    let dispatchQueue = DispatchQueue(label: "PostProcess", qos: .background)
                                    dispatchQueue.async {
                                      let processed = postprocess!(convertedResult)
                                      callback(processed)
                                    }
                                  }else { callback(convertedResult) }
                                } else{
                                    print(error.debugDescription)
                                    callback(nil)
                                }
    })
    
    getHealthStore().execute(query)
  }
   
   
   
   
   @objc
   func queryHealthData(_ params: NSDictionary, completion callback: @escaping RCTResponseSenderBlock) -> Void{
   if(params.value(forKey: "to") != nil && params.value(forKey: "from") != nil && params.value(forKey: "dataType") != nil){
   let fromEpoch = params.value(forKey: "from") as! Double
   let toEpoch = params.value(forKey: "to") as! Double
   let dataType = params.value(forKey: "dataType") as! String
   
   switch dataType{
   
   case "step":
   queryHourlySteps(from: fromEpoch, to: toEpoch, completion: callback)
   break;
   
   case "heartrate":
   querySamples(from: fromEpoch, to: toEpoch, type: HKObjectType.quantityType(forIdentifier: .heartRate)!, convert: { (sample) in
   let qSample = sample as! HKQuantitySample
   return [
   "measuredAt": HealthKitManager.convertDateToUnix(qSample.startDate),
   "value": Int(round(qSample.quantity.doubleValue(for: self.bpmUnit)))
   ]
   }, postprocess: nil, completion: callback)
   break;
   
   case "sleep":
   querySamples(from: fromEpoch, to: toEpoch, type: HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!, convert: { (sample) in
   let qSample = sample as! HKCategorySample
   let type: String
   switch qSample.value {
   case HKCategoryValueSleepAnalysis.asleep.rawValue:
   type = "asleep"
   break;
   case HKCategoryValueSleepAnalysis.awake.rawValue:
   type = "awake"
   break;
   case HKCategoryValueSleepAnalysis.inBed.rawValue:
   type = "inBed"
   break;
   default:
   type = "unknown"
   break;
   }
   
   return SleepAnalysisLog(
   type: type,
   startedAt: HealthKitManager.convertDateToUnix(qSample.startDate),
   endedAt: HealthKitManager.convertDateToUnix(qSample.endDate))
   }, postprocess: {
   (list) in
   //Merge the overlapping logs
   let sessionUnits = list as! [SleepAnalysisLog]
   
   if sessionUnits.count > 0 {
   var mergedLogs: [MergedSleepLog] = []
   var currentSession: MergedSleepLog? = nil
   
   sessionUnits.forEach { log in
   if currentSession != nil && currentSession!.startedAt <= log.endedAt && currentSession!.endedAt >= log.startedAt {
   //overlap, expand the range first
   currentSession!.startedAt = min(log.startedAt, currentSession!.startedAt)
   currentSession!.endedAt = max(log.endedAt, currentSession!.endedAt)
   } else {
   if currentSession != nil {
   mergedLogs.append(currentSession!)
   }
   currentSession = MergedSleepLog(startedAt: log.startedAt, endedAt: log.endedAt, mergedAsleeps: [])
   }
   
   if log.type == "asleep" { //if the log is an asleep log, merge it to the asleepLogs.
   //compare only with the last log
   if currentSession!.mergedAsleeps.count == 0 {
   currentSession!.mergedAsleeps.append(RangeLog(startedAt: log.startedAt, endedAt: log.endedAt))
   } else {
   var lastSession = currentSession!.mergedAsleeps.last!
   if lastSession.startedAt <= log.endedAt && lastSession.endedAt >= log.startedAt {
   //overlaps. merge
   lastSession.startedAt = min(log.startedAt, lastSession.startedAt)
   lastSession.endedAt = max(log.endedAt, lastSession.endedAt)
   currentSession!.mergedAsleeps.removeLast()
   currentSession!.mergedAsleeps.append(lastSession)
   }else {
   //not overlaps. append.
   currentSession!.mergedAsleeps.append(RangeLog(startedAt: log.startedAt, endedAt: log.endedAt))
   }
   }
   }
   }
   if currentSession != nil {
   mergedLogs.append(currentSession!)
   }
   
   return mergedLogs.map{ $0.toDictionary() }
   }else{
   return []
   }
   }, completion: callback)
   break;
   
   case "weight":
   querySamples(from: fromEpoch, to: toEpoch, type: HKObjectType.quantityType(forIdentifier: .bodyMass)!, convert: { (sample) in
   let wSample = sample as! HKQuantitySample
   return [
   "measuredAt": HealthKitManager.convertDateToUnix(wSample.startDate),
   "value": wSample.quantity.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
   ]
   }, postprocess: nil, completion: callback)
   break;
   
   case "workout":
   querySamples(from: fromEpoch, to: toEpoch, type: HKObjectType.workoutType(), convert: { (sample) in
   let wSample = sample as! HKWorkout
   return [
   "startedAt": HealthKitManager.convertDateToUnix(wSample.startDate),
   "endedAt": HealthKitManager.convertDateToUnix(wSample.endDate),
   "activityTypeCode": wSample.workoutActivityType.rawValue
   ]
   }, postprocess: nil, completion: callback)
   break;
   
   default:
   callback([["error": "UnsupportedDataType"], NSNull()])
   return
   }
   }else{
   callback([["error":"ParameterError"], NSNull()])
   }
   }*/
  
  
}
