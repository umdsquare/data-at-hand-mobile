
let bugsnagClient: any = null

export interface ErrorReport {
    context?: string,
    errorClass?: string,
    errorMessage?: string,
    groupingHash?: string,
    severity?: 'warning' | 'error' | 'info'
    metadata?: any
}

export function initErrorReportingService() {
    if (__DEV__ === false) {
        try {
            const bugsnagInfo = require("@credentials/bugsnag.json")
            if (bugsnagInfo != null && bugsnagInfo.api_key != null && bugsnagInfo.api_key.length > 0) {
                bugsnagClient = new (require('bugsnag-react-native').Client)(bugsnagInfo.api_key)
            }
        } catch (ex) {
            console.log(ex)
        }
    }
}

export function notifyError(error: Error, before?: (report: ErrorReport) => void) {
    if (bugsnagClient != null) {
        bugsnagClient.notify(error, before)
    }
}