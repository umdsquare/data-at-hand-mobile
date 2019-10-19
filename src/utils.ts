import Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment)

export function sleep(milis: number): Promise<void>{
    return new Promise(resolve => setTimeout(resolve, milis));
}

export function sequenceDays(start: number|Date, end: number|Date): Array<Date>{
    const startDateMoment = moment(start).startOf('day')
    const endDateMoment = moment(end).startOf('day')
    const sequence = moment().range(startDateMoment, endDateMoment).by('days')
    const days = new Array<Date>()
    for(let day of sequence){
      days.push(day.toDate())
    }
    return days
}