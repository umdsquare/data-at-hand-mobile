//
//  HealthKitManager.swift
//  DataAtHand
//
//  Created by Young-Ho Kim on 10/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import HealthKit

@objc(HealthKitManager)
class HealthKitManager: NSObject{
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
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
  
}
