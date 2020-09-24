//
//  WeightRangeMeasure.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class WeightRangeMeasure : DataSourceRangeMeasureBase {
  
  private let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass)!
  
  private let trendMeasure = WeightTrendMeasure()
  
  override func getPreferredValueRange(_ store: HKHealthStore, completion onComplete: @escaping (_ error: Error?, _ result: [Double?]) -> Void) {
    self.trendMeasure.getPreferredValueRange(store, completion: onComplete)
  }
  
  override func getTodayValue(_ store: HKHealthStore, completion onComplete: @escaping (Any?) -> Void) {
    
    let query = HKSampleQuery(sampleType: self.weightType, predicate: nil,
                              limit: 1,
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  if (results?.count ?? 0) > 0 {
                                    onComplete((results!.first! as! HKQuantitySample).quantity.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo)))
                                  }else{
                                    onComplete(nil)
                                  }
                                } else{
                                  onComplete(nil)
                                }
    })
    
    store.execute(query)
  }
  
  
  private func getNearestLog(_ store: HKHealthStore, pivotNumberedDate: Int, fromPastDirection: Bool, completion onComplete: @escaping (Any?) -> Void) {
    
    let pivotDate = HealthKitManager.convertNumberedDateToDate(pivotNumberedDate)
    
    let explicitTimeInterval = fromPastDirection == true ? HKQuery.predicateForSamples(withStart: nil, end: pivotDate, options: [HKQueryOptions.strictStartDate]) : HKQuery.predicateForSamples(withStart: pivotDate.addingTimeInterval(TimeInterval(24*60*60)), end: nil, options: [HKQueryOptions.strictStartDate])
    
    //NSPredicate(format: "%K > %@", HKPredicateKeyPathStartDate, pivotDate as CVarArg) : NSPredicate(format: "%K < %@", HKPredicateKeyPathStartDate, pivotDate.addingTimeInterval(TimeInterval(24*60*60)) as CVarArg)
    
    
    let query = HKSampleQuery(sampleType: self.weightType, predicate: explicitTimeInterval,
                              limit: 1,
                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: !fromPastDirection)],
                              resultsHandler: {query, results, error in
                                if error == nil {
                                  
                                  if (results?.count ?? 0) > 0 {
                                    
                                    let qSample = results!.first! as! HKQuantitySample
                                    let components = Calendar.current.dateComponents([.year, .month, .weekday], from: qSample.startDate)
                                    let numberedDate = HealthKitManager.convertDateToNumberedDate(qSample.startDate)
                                    
                                    onComplete(
                                    [
                                      "numberedDate": numberedDate,
                                      "year": components.year!,
                                      "month": components.month!,
                                      "dayOfWeek": components.weekday! - 1,
                                      "secondOfDay": Int(qSample.startDate.timeIntervalSince1970 - HealthKitManager.convertNumberedDateToDate(numberedDate).timeIntervalSince1970),
                                      "value": qSample.quantity.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
                                    ]
                                    )
                                                                        
                                  }else{
                                    onComplete(nil)
                                  }
                                } else{
                                  onComplete(nil)
                                }
    })
    
    store.execute(query)
  }
  
  override func getStatistics(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Error?, Any?) -> Void) {
    
    let fromDate = HealthKitManager.convertNumberedDateToDate(start)
    let toDate = Calendar.current.startOfDay(for: HealthKitManager.convertNumberedDateToDate(end)).addingTimeInterval(TimeInterval(24*60*60))
    
    let predicate = HKQuery.predicateForSamples(withStart: fromDate, end: toDate, options: [.strictStartDate, .strictEndDate])
    
    var minValue: Double? = nil
    var maxValue: Double? = nil
    var avg: Double? = nil
    
    let dispatchGroup = DispatchGroup.init()
    
    let minQuery = HKStatisticsQuery(quantityType: self.weightType, quantitySamplePredicate: predicate,
                                     options: HKStatisticsOptions.discreteMin) { (query, stat, error) in
                                      if(error == nil){
                                        minValue = stat!.minimumQuantity()?.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
                                      }
                                      dispatchGroup.leave()
    }
    
    let maxQuery = HKStatisticsQuery(quantityType: self.weightType, quantitySamplePredicate: predicate,
                                     options: HKStatisticsOptions.discreteMax) { (query, stat, error) in
                                      if(error == nil){
                                        maxValue = stat!.maximumQuantity()?.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
                                      }
                                      dispatchGroup.leave()
    }
    
    let avgQuery = HKStatisticsQuery(quantityType: self.weightType, quantitySamplePredicate: predicate,
                                     options: HKStatisticsOptions.discreteAverage) { (query, stat, error) in
                                      if(error == nil){
                                        avg = stat!.averageQuantity()?.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
                                      }
                                      dispatchGroup.leave()
    }
    
    dispatchGroup.enter()
    store.execute(minQuery)
    dispatchGroup.enter()
    store.execute(maxQuery)
    dispatchGroup.enter()
    store.execute(avgQuery)
    
    dispatchGroup.notify(queue: DispatchQueue(label: "WeightStatistics", qos: .background)){
      callback(nil, [
        ["type": "avg", "value": avg],
        ["type": "range", "value": [minValue, maxValue]]
      ])
    }
  }
  
  override func queryDayLevelMetricData(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Any?) -> Void) {
    let weightQueryDispatchGroup = DispatchGroup.init()
    let dispatchQueue = DispatchQueue(label: "WeightLoad", qos: .background)
    
    var weightTrend: Any? = nil
    var weightLogs: Any? = nil
    
    weightQueryDispatchGroup.enter()
    //weight trend
    
    self.trendMeasure.queryDayLevelMetricData(store, start: start, end: end){ (result) in
      weightTrend = result
      weightQueryDispatchGroup.leave()
    }
    
    weightQueryDispatchGroup.enter()
    //weight trend
    HealthKitManager.querySamples(store, start: start, end: end, type: self.weightType, convert: { (sample) in
      let qSample = sample as! HKQuantitySample
      let components = Calendar.current.dateComponents([.year, .month, .weekday], from: sample.startDate)
      let numberedDate = HealthKitManager.convertDateToNumberedDate(sample.startDate)
      return [
        "numberedDate": numberedDate,
        "year": components.year!,
        "month": components.month!,
        "dayOfWeek": components.weekday! - 1,
        "secondOfDay": Int(sample.startDate.timeIntervalSince1970 - HealthKitManager.convertNumberedDateToDate(numberedDate).timeIntervalSince1970),
        "value": qSample.quantity.doubleValue(for: HKUnit.gramUnit(with: HKMetricPrefix.kilo))
      ]
    }, postprocess: nil){ (result) in
      weightLogs = result
      weightQueryDispatchGroup.leave()
    }
    
    //nearest logs
    var futureNearestLog: Any? = nil
    var pastNearestLog: Any? = nil
    
    weightQueryDispatchGroup.enter()
    self.getNearestLog(store, pivotNumberedDate: end, fromPastDirection: false) { (log) in
      futureNearestLog = log
      weightQueryDispatchGroup.leave()
    }
    
    weightQueryDispatchGroup.enter()
    self.getNearestLog(store, pivotNumberedDate: start, fromPastDirection: true) { (log) in
      pastNearestLog = log
      weightQueryDispatchGroup.leave()
    }
    
    weightQueryDispatchGroup.notify(queue: dispatchQueue) {
      callback([
        "trend": weightTrend ?? [],
        "logs": weightLogs ?? [],
        "futureNearestLog": futureNearestLog,
        "pastNearestLog": pastNearestLog
      ])
    }
  }
}
