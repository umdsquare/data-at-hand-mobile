import { ExplorationInfo, ParameterType, inferIntraDayDataSourceType, IntraDayDataSourceType, getIntraDayDataSourceName } from "@core/exploration/types";
import { SpeechContext, SpeechContextType, DateElementSpeechContext, RangeElementSpeechContext } from "./nlp/context";
import { explorationInfoHelper } from "@core/exploration/ExplorationInfoHelper";
import { DataSourceType } from "@measure/DataSourceSpec";
import { DataSourceManager } from "@measure/DataSourceManager";
import { DateTimeHelper } from "@utils/time";

export function generateExampleSentences(info: ExplorationInfo, context: SpeechContext, today: Date): string[] | null {

    if (context) {
        switch (context.type) {
            case SpeechContextType.DateElement:
                {
                    const c = context as DateElementSpeechContext
                    const currentDataSource = c.dataSource || explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
                    const currentIntradayDataSource = currentDataSource ? inferIntraDayDataSourceType(currentDataSource) : null

                    const dsToRecommend: Array<string> = []
                    for (const ids of DataSourceManager.instance.supportedIntraDayDataSources) {
                        if (ids !== currentIntradayDataSource) {
                            dsToRecommend.push(getIntraDayDataSourceName(ids))
                            if (dsToRecommend.length >= 2) {
                                break;
                            }
                        }
                    }

                    return dsToRecommend
                }
            case SpeechContextType.RangeElement:
                {
                    const c = context as RangeElementSpeechContext
                    const currentDataSource = c.dataSource || explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
                    const anotherSourceName = DataSourceManager.instance.supportedDataSources.find(spec => spec.type !== currentDataSource).name

                    const recommend: Array<string> = [`Go to ${anotherSourceName}`]


                    return recommend
                }
            case SpeechContextType.Time:
                {

                }
            case SpeechContextType.Global:
                {

                }
        }
    }

    return null
}

function getAnotherRangeText(range: [number, number], ref: Date, ...excludes: [number, number][]): string{
    const semanticTest = DateTimeHelper.rangeSemantic(range[0], range[1], ref)
    if(semanticTest){
        switch(semanticTest.semantic){
            case 'year':
                if(semanticTest.differenceToRef < 0){

                }
        }
    }else{
        //arbitrary range
    }
    return "last week"
}