import { DataSource } from "../measure/source/DataSource"
import { FitbitSource } from "../measure/source/fitbit/FitbitSource"

class SourceManager{
    installedServices: ReadonlyArray<DataSource> = [
        new FitbitSource()
    ]
}

const sourceManager = new SourceManager()
export { sourceManager }