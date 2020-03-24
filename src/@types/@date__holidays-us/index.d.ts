declare module "@date/holidays-us" {
    interface Holidays {
        newYearsDay: (year?: number) => Date
        valentinesDay: (year?: number) => Date
        martinLutherKingDay: (year?: number) => Date
        presidentsDay: (year?: number) => Date
        easter: (year?: number) => Date
        mothersDay: (year?: number) => Date
        memorialDay: (year?: number) => Date
        fathersDay: (year?: number) => Date
        independenceDay: (year?: number) => Date
        laborDay: (year?: number) => Date
        columbusDay: (year?: number) => Date
        halloween: (year?: number) => Date
        veteransDay: (year?: number) => Date
        thanksgiving: (year?: number) => Date
        christmas: (year?: number) => Date
        [key:string]: (year?: number) => Date
    }
    
    const holidays: Holidays
    export default holidays

}