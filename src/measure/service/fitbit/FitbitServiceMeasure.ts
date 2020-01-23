import { FitbitService } from "./FitbitService"
import { FitbitLocalCacheConfig } from "./realm/schema"


function useLocalCacheRealm( usageFunc: (realm: Realm)=>void): Promise<void>{
  return Realm.open(FitbitLocalCacheConfig).then(realm => {
    usageFunc(realm)
    realm.close()
  })
}


async function useLocalCacheRealmAndGet<T>( usageFunc: (realm: Realm)=>T): Promise<T>{
  return Realm.open(FitbitLocalCacheConfig).then(realm => {
    const result = usageFunc(realm)
    realm.close()
    return result
  })
}

export abstract class FitbitServiceMeasure{

    constructor(protected readonly service: FitbitService) {
    }
  
    protected useRealm(usageFunc: (realm: Realm)=>void): Promise<void>{
      return useLocalCacheRealm(usageFunc)
    }
  
    protected useRealmAndGet<T>(usageFunc: (realm: Realm) => T): Promise<T>{
      return useLocalCacheRealmAndGet(usageFunc)
    }
  
    abstract cacheServerData(startDate: number, endDate: number): Promise<{success: boolean}>
  }