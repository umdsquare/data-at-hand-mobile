import { FitbitService } from "./FitbitService";

export class FitbitServiceMeasureBase {
    constructor(protected readonly service: FitbitService) {}

    clearLocalCache(): Promise<void>{
        return Promise.resolve()
    }
}