//
//  HealthKitManager.m
//  DataAtHand
//
//  Created by Young-Ho Kim on 10/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTConvert.h>

@interface RCT_EXTERN_MODULE(HealthKitManager, NSObject)

  RCT_EXTERN_METHOD(isAvailableInSystem:(RCTResponseSenderBlock*)callback)
  RCT_EXTERN_METHOD(requestPermissions:(NSArray)permissions completion:(RCTResponseSenderBlock*)callback)
  RCT_EXTERN_METHOD(queryHealthData: (NSDictionary*)params completion:(RCTResponseSenderBlock*)callback)

@end

@interface RCT_EXTERN_MODULE(SpeechRecognitionManager, RCTEventEmitter)

  RCT_EXTERN_METHOD(install:(RCTResponseSenderBlock*)callback)
  RCT_EXTERN_METHOD(isAvailableInSystem:(RCTResponseSenderBlock*)callback)

  RCT_EXTERN_METHOD(start:(RCTResponseSenderBlock*)callback)
  RCT_EXTERN_METHOD(stop:(RCTResponseSenderBlock*)callback)

@end