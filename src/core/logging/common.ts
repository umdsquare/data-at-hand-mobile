

function readStudyConfig() {
    try {
        return require('@credentials/study.json')
    } catch (ex) {
        return null
    }
}

const studyCredentials = readStudyConfig()

export function getUploadServerHostUrl(): string | undefined {
    if (studyCredentials != null && studyCredentials.backend_logging_url != null && studyCredentials.backend_logging_url.length > 0) {
        return studyCredentials.backend_logging_url
    } else return undefined
}