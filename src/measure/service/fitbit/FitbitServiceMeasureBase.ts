import { FitbitServiceCore } from "./types";

export abstract class FitbitServiceMeasureBase {
    constructor(protected readonly core: FitbitServiceCore) {}

    abstract displayName: string;
    
    clearLocalCache(): Promise<void>{
        return Promise.resolve()
    }

    abstract async cacheServerData(
        endDate: number,
      ): Promise<{ success: boolean; skipped?: boolean }> 
}