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

@objc(HealthKitManager)
class HealthKitManager: NSObject{
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  static func convertDateToUnix(_ date: Date) -> Int{
    return Int(date.timeIntervalSince1970*1000)
  }
  
  private let dateFormatter = DateFormatter()
  private let bpmUnit: HKUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
  
  private var _healthStore: HKHealthStore? = nil
  func getHealthStore() -> HKHealthStore{
    if(_healthStore != nil){
      return _healthStore!
    }else{
      _healthStore = HKHealthStore()
      return _healthStore!
    }
  }
  
  override init(){
    dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZ"
  }
  
  deinit {
    
  }
  
  private func convertTextToObjectType(text: String) -> HKObjectType?
  {
    switch text {
    case "heartrate": return HKObjectType.quantityType(forIdentifier: .heartRate)
    case "step": return HKObjectType.quantityType(forIdentifier: .stepCount)
    case "weight": return HKObjectType.quantityType(forIdentifier: .bodyMass)
    case "sleep": return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
    case "workout": return HKObjectType.workoutType()
    default: return nil
    }
  }
  
  @objc
  func isAvailableInSystem(_ callback: RCTResponseSenderBlock) -> Void{
    callback([NSNull(), ["available": HKHealthStore.isHealthDataAvailable()]])
  }
  
  @objc
  func requestPermissions(_ permissions: NSArray, completion callback: @escaping RCTResponseSenderBlock) -> Void{
    
    let objectTypes = permissions.map{ self.convertTextToObjectType(text: $0 as! String) }.filter{ $0 != nil }.map{ $0! }
    
    
    let permissionSet = Set(objectTypes)
    getHealthStore().requestAuthorization(toShare: nil, read: permissionSet, completion: {(success, error) in
      if !success {
        print(error?.localizedDescription)
        callback([NSNull(), ["approved": false]])
      }else{
        //process successed, but check again to make sure the permissions were actually granted.
        callback([NSNull(), ["approved": true]])
      }}
    )
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
  }
  
  private func queryHourlySteps(from: Double, to: Double, completion callback: @escaping RCTResponseSenderBlock){
    let calendar = Calendar.current
    var interval = DateComponents()
    interval.hour = 1
    
    let fromDate = calendar.startOfDay(for: Date.init(timeIntervalSince1970: TimeInterval(from/1000)))
    let toDate = calendar.startOfDay(for: Date.init(timeIntervalSince1970: TimeInterval(to/1000))).addingTimeInterval(TimeInterval(24*60*60))
    
    let query = HKStatisticsCollectionQuery(
      quantityType: HKObjectType.quantityType(forIdentifier: .stepCount)!,
      quantitySamplePredicate: nil,
      options: HKStatisticsOptions.cumulativeSum,
      anchorDate: fromDate, intervalComponents: interval)
    
    query.initialResultsHandler = {
      query, results, error in
      
      if error == nil {
        var dataList: [[String:Any]] = []
        results?.enumerateStatistics(from: fromDate, to: toDate, with: {(datum, stop) in
          dataList.append(
            [
              "startedAt": HealthKitManager.convertDateToUnix(datum.startDate),
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
  
  private func querySamples(from: Double, to: Double, type: HKSampleType,
                            convert: @escaping (HKSample)->Any,
                            postprocess: (([Any])->[NSDictionary])?,
                            completion callback: @escaping RCTResponseSenderBlock){
    let calendar = Calendar.current
    let fromDate = calendar.startOfDay(for: Date.init(timeIntervalSince1970: TimeInterval(from/1000)))
    let toDate = calendar.startOfDay(for: Date.init(timeIntervalSince1970: TimeInterval(to/1000))).addingTimeInterval(TimeInterval(24*60*60))
    
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
                                      callback([NSNull(), processed])
                                    }
                                  }else { callback([NSNull(), convertedResult]) }
                                } else{
                                  callback([["error": error?.localizedDescription], NSNull()])
                                }
    })
    
    getHealthStore().execute(query)
  }
  
}
