export class SystemError{
    constructor(
        readonly type: string,
        readonly message: string | undefined = undefined,
        readonly payload: any | undefined = undefined){}
}