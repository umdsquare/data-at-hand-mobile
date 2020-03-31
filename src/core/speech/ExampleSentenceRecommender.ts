import { inferIntraDayDataSourceType, getIntraDayDataSourceName } from "@core/exploration/types";
import { SpeechContext, SpeechContextType, DateElementSpeechContext, RangeElementSpeechContext } from "./nlp/context";
import { explorationInfoHelper } from "@core/exploration/ExplorationInfoHelper";
import { DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { DataSourceManager } from "@measure/DataSourceManager";
import { DateTimeHelper } from "@utils/time";
import holidays from '@date/holidays-us';
import { isSameDay, getYear, isAfter } from "date-fns";
import { ExplorationInfo, ParameterType, ExplorationType } from "@data-at-hand/core/exploration/ExplorationInfo";

const holidayRecommendationList: ReadonlyArray<{ func: string | ((year: number) => Date), casualName: string }> = [
    {
        func: "christmas",
        casualName: "Christmas"
    },
    {
        func: "newYearsDay",
        casualName: "New Year's Day"
    },
    {
        func: "thanksgiving",
        casualName: "Thanksgiving"
    },
    {
        func: 'halloween',
        casualName: 'Halloween'
    },
    {
        func: 'columbusDay',
        casualName: 'Columbus Day'
    },
]

let cachedRef: Date | undefined = undefined
let cachedRecentHolidays: Array<{ casualName: string, date: Date }> | undefined = undefined

function getRecentHolidays(ref: Date): Array<{ casualName: string, date: Date }> {
    if (isSameDay(cachedRef, ref) === false) {
        //make holidays
        const result: Array<{ casualName: string, date: Date }> = []
        for (const recom of holidayRecommendationList) {
            let year = getYear(ref) + 1
            let date
            do {
                year--
                if (typeof recom.func === 'string') {
                    date = holidays[recom.func](year)
                } else {
                    date = recom.func(year)
                }
            } while (isAfter(date, ref))

            if (isSameDay(date, ref) === false) {
                result.push({
                    date,
                    casualName: recom.casualName
                })
            }
        }
        cachedRecentHolidays = result
        cachedRef = ref
    }

    return cachedRecentHolidays
}

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

                    const recommend: Array<string> = [`Go to ${getAnotherDataSource(currentDataSource)}`]

                    return recommend
                }
            case SpeechContextType.Time:
                {

                }
            case SpeechContextType.Global:
                {
                    switch (info.type) {
                        case ExplorationType.B_Overview:
                            {
                                const recommend = []
                                const range = explorationInfoHelper.getParameterValue<[number, number]>(info, ParameterType.Range)
                                const anotherRangeText = getAnotherRangeText(range, today)
                                recommend.push(anotherRangeText)
                                recommend.push("Compare with step count of " + anotherRangeText)
                                if (DateTimeHelper.getNumDays(range[0], range[1]) >= 28) {
                                    recommend.push("Show step count by days of the week")
                                }

                                return recommend
                            }
                        case ExplorationType.B_Range:
                            {
                                const recommend = []

                                const currentDataSource = explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
                                const range = explorationInfoHelper.getParameterValue<[number, number]>(info, ParameterType.Range)
                                const anotherRangeText = getAnotherRangeText(range, today)

                                recommend.push("Compare with " + anotherRangeText)
                                recommend.push(`${getAnotherDataSource(currentDataSource)} of ${anotherRangeText}`)

                                return recommend
                            }
                        case ExplorationType.B_Day:
                            {
                                const currentDataSource = explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
                                const currentDate = DateTimeHelper.toDate(explorationInfoHelper.getParameterValue<number>(info, ParameterType.Date))

                                const recommend = ["last week"]

                                const recentHolidays = getRecentHolidays(currentDate)
                                const holidayToRecommend = recentHolidays[Math.floor((Math.random() * recentHolidays.length))]

                                recommend.push(holidayToRecommend.casualName)

                                return recommend
                            }
                        case ExplorationType.C_TwoRanges:
                            
                            break;
                        case ExplorationType.C_Cyclic:

                            break;
                        case ExplorationType.C_CyclicDetail_Daily:
                            break;
                        case ExplorationType.C_CyclicDetail_Range:
                            break;
                    }
                }
        }
    }

    return null
}

function getAnotherDataSource(dataSource: DataSourceType): string {
    return DataSourceManager.instance.supportedDataSources.find(spec => spec.type !== dataSource).name
}

const humanOffsets = [-1, 0]
function getAnotherRangeText(range: [number, number], ref: Date, ...excludes: [number, number][]): string {
    const semanticTest = DateTimeHelper.rangeSemantic(range[0], range[1], ref)
    if (semanticTest) {
        const properOffset = humanOffsets.find(o => {
            if (o !== -semanticTest.differenceToRef) {
                const candidateRange = DateTimeHelper.getSemanticRange(ref, semanticTest.semantic, o)
                return excludes.find(e => e[0] === candidateRange[0] && e[1] === candidateRange[1]) == null
            } else return false
        })

        if (properOffset != null) {
            const prefix = properOffset === 0 ? "this" : "last"
            if (semanticTest.semantic === 'mondayWeek' || semanticTest.semantic === 'sundayWeek') {
                return prefix + " week"
            } else return prefix + " " + semanticTest.semantic
        }
    } else {
        //arbitrary range
    }
    return "last month"
}