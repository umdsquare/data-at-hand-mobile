//
//  DataSourceDailySummaryMeasureBase.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 9/19/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import HealthKit

class DataSourceDailySummaryMeasureBase : DataSourceRangeMeasureBase {
  
  let type: HKQuantityType
  let collectionOptions: HKStatisticsOptions
  
  init(_ typeIdentifier: HKQuantityTypeIdentifier, _ collectionOptions: HKStatisticsOptions){
    self.type = HKObjectType.quantityType(forIdentifier: typeIdentifier)!
    self.collectionOptions = collectionOptions
  }
  
  func getValueFromDayLevelStatistics(_ stat: HKStatistics) -> Double?{
    preconditionFailure("Implement this function")
  }
  
  func makeStatistics(_ min: Double?, _ max: Double?, _ sum: Double?, _ avg: Double?) -> Any? {
      return [
        ["type": "avg", "value": avg],
        ["type": "total", "value": sum],
        ["type": "range", "value": [min, max]]
    ]
  }
  
  override func getStatistics(_ store: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Error?, Any?) -> Void) {
      var interval = DateComponents()
      interval.day = 1
      
      let startDate = HealthKitManager.convertNumberedDateToDate(start)
      let endDate = HealthKitManager.convertNumberedDateToDate(end)
      
      let query = HKStatisticsCollectionQuery(
        quantityType: self.type,
        quantitySamplePredicate: nil,
        options: self.collectionOptions,
        anchorDate: startDate, intervalComponents: interval)
      
      query.initialResultsHandler = {
        query, results, error in
        
        if error == nil {
          
          var minValue: Double? = nil
          var maxValue: Double? = nil
          var sum: Double? = nil
          var length: Double = 0
          results?.enumerateStatistics(from: startDate, to: endDate, with: {(datum, stop) in
            let value: Double? = self.getValueFromDayLevelStatistics(datum)
            
            if value != nil {
              if minValue != nil {
                minValue = min(minValue!, value!)
              }else {
                minValue = value
              }
              
              if maxValue != nil{
                maxValue = max(maxValue!, value!)
              }else{
                maxValue = value
              }
              
              if sum != nil{
                sum = sum! + value!
              } else {
                sum = value!
              }
              
              length = length + 1
            }
            
          })
          
          callback(nil, self.makeStatistics(minValue, maxValue, sum, sum != nil ? sum!/length : nil))
        } else {
          callback(error, nil)
        }
      }
      
      store.execute(query)
  }

  override func getPreferredValueRange(_ healthStore: HKHealthStore, completion onComplete: @escaping (_ error: Error?, _ result: [Double?]) -> Void) {
    var interval = DateComponents()
    interval.day = 1
    
    //let calendar = Calendar.current
    let startDate = healthStore.earliestPermittedSampleDate()
    //let endDate = calendar.startOfDay(for: Date()).addingTimeInterval(TimeInterval(24*60*60))
    
    let query = HKStatisticsCollectionQuery(
      quantityType: self.type,
      quantitySamplePredicate: nil,
      options: self.collectionOptions,
      anchorDate: startDate,
      intervalComponents: interval)
    
    query.initialResultsHandler = {
      query, results, error in
      
      if error == nil {
        
        let statList = results!.statistics().map({ (stat) -> Double? in
          return self.getValueFromDayLevelStatistics(stat)
        }).filter({ (value: Double?) -> Bool in
          return value != nil
        }).sorted { (a, b)-> Bool in
          return a! < b!
        }
                
        if(statList.count > 0){
          
          //find percentiles
          
          let percentile25 = statList[min(statList.count - 1, Int(round(Double(statList.count) * 0.25)))]!
          let percentile75 = statList[min(statList.count - 1, Int(round(Double(statList.count) * 0.75)))]!
          
          let iqr = percentile75 - percentile25
          
          let lowerBound = percentile25 - iqr
          let upperBound = percentile75 + iqr
          
          let upperIndex = statList.lastIndex { (value: Double?) -> Bool in
            value! <= upperBound
            } ?? (statList.count - 1)
          
          let lowerIndex = statList.firstIndex { (value: Double?) -> Bool in
            value! >= lowerBound
            } ?? 0
          
          onComplete(nil, [statList[lowerIndex]!, statList[upperIndex]!])
          
        }else {
          onComplete(nil, [nil, nil])
        }
        
        //
        
      } else {
        onComplete(error, [nil, nil])
      }
    }
    
    healthStore.execute(query)
  }
  
  override func getTodayValue(_ store: HKHealthStore, completion onComplete: @escaping (Any?) -> Void) {
    
    let fromDate = Calendar.current.startOfDay(for: Date())
    let toDate = fromDate.addingTimeInterval(TimeInterval(24*60*60))
    
    let predicate = HKQuery.predicateForSamples(withStart: fromDate, end: toDate, options: [.strictStartDate, .strictEndDate])
    
    let query = HKStatisticsQuery(quantityType: self.type,
                                  quantitySamplePredicate: predicate,
                                  options: self.collectionOptions) { (_, stat, error) in
                                    if error == nil && stat != nil {
                                      onComplete(self.getValueFromDayLevelStatistics(stat!))
                                    }else {
                                      onComplete(nil)
                                    }
    }
    
    store.execute(query)
  }
  
  override func queryDayLevelMetricData(_ healthStore: HKHealthStore, start: Int, end: Int, completion callback: @escaping (Any?) -> Void) {
    var interval = DateComponents()
    interval.day = 1
    
    let startDate = HealthKitManager.convertNumberedDateToDate(start)
    let endDate = HealthKitManager.convertNumberedDateToDate(end)
    
    let query = HKStatisticsCollectionQuery(
      quantityType: self.type,
      quantitySamplePredicate: nil,
      options: self.collectionOptions,
      anchorDate: startDate, intervalComponents: interval)
    
    query.initialResultsHandler = {
      query, results, error in
      
      if error == nil {
        var dataList: [[String:Any]] = []
        results?.enumerateStatistics(from: startDate, to: endDate, with: {(datum, stop) in
          
          let components = Calendar.current.dateComponents([.year, .month, .weekday], from: datum.startDate)
          let value: Double? = self.getValueFromDayLevelStatistics(datum)
          
          if value != nil {
            dataList.append(
              [
                "numberedDate": HealthKitManager.convertDateToNumberedDate(datum.startDate),
                "year": components.year!,
                "month": components.month!,
                "dayOfWeek": components.weekday! - 1,
                "value": value!
              ]
            )
          }
          
        })
        callback(dataList)
      } else {
        callback(nil)
      }
    }
    
    healthStore.execute(query)
  }
}
