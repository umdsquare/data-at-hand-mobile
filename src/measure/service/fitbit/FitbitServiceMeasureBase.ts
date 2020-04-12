import { FitbitServiceCore } from "./types";

export class FitbitServiceMeasureBase {
    constructor(protected readonly core: FitbitServiceCore) {}

    clearLocalCache(): Promise<void>{
        return Promise.resolve()
    }
}