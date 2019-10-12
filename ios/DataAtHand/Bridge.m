//
//  HealthKitManager.m
//  DataAtHand
//
//  Created by Young-Ho Kim on 10/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HealthKitManager, NSObject)

RCT_EXTERN_METHOD(isAvailableInSystem:(RCTResponseSenderBlock*)callback)
RCT_EXTERN_METHOD(requestPermissions:(NSArray)permissions completion:(RCTResponseSenderBlock*)callback)

@end
