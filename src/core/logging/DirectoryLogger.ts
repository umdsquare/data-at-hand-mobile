import { CachesDirectoryPath, exists, mkdir, writeFile, appendFile, unlink } from 'react-native-fs';
import path from 'react-native-path'
import { zip } from 'react-native-zip-archive';
import { Mutex } from 'async-mutex';
import { getVersion, getUniqueId } from 'react-native-device-info';
import { Platform } from 'react-native';
import { getUploadServerHostUrl } from './common';
import { notifyError } from "./ErrorReportingService"

export class DirectoryLogger {

    readonly fullDirectoryPath: string

    private readonly fileLoggerMap = new Map<string, DebouncedFileLogger>()

    private readonly sessionInfo = {
        sessionId: this.sessionId,
        platform: Platform.OS,
        instanceUID: getUniqueId(),
        appVersion: getVersion(),
        environment: __DEV__ ? "development" : "production"
    }

    constructor(readonly directoryPath: string, readonly sessionId: string) {
        this.fullDirectoryPath = path.resolve(CachesDirectoryPath, directoryPath)
    }

    appendJsonLine(filename: string, object: any, timestamp = Date.now()) {
        object["timestamp"] = timestamp
        const line = JSON.stringify(object)

        if (this.fileLoggerMap.has(filename) === false) {
            this.fileLoggerMap.set(filename, new DebouncedFileLogger(this.fullDirectoryPath, filename, this.sessionInfo))
        }

        this.fileLoggerMap.get(filename).appendLine(line)
    }

    async removeAllFilesInDirectory(): Promise<void> {
        if (await exists(this.fullDirectoryPath) === true) {
            await unlink(this.fullDirectoryPath)
        }
    }

    async zipLogs(): Promise<{ filePath: string, mimeType: string } | null> {
        if (await exists(this.fullDirectoryPath) === true) {
            await writeFile(
                path.resolve(this.fullDirectoryPath, "info.json"),
                JSON.stringify({
                    sessionId: this.sessionId,
                    platform: Platform.OS,
                    instanceUID: getUniqueId(),
                    appVersion: getVersion(),
                    environment: __DEV__ ? "development" : "production"
                }),
                'utf8')
            let finalFilePath = path.resolve(CachesDirectoryPath, 'logs_' + path.basename(this.fullDirectoryPath) + '.zip')
            finalFilePath = await zip(this.fullDirectoryPath, finalFilePath)
            return {
                filePath: finalFilePath,
                mimeType: 'application/zip'
            }
        } else return null
    }
}

class DebouncedFileLogger {

    private readonly queue = new Array<string>()

    private readonly filePath: string

    private nextTimeoutAt: number | null = null
    private timeout: NodeJS.Timeout | null = null
    private writeTaskMutex = new Mutex()

    constructor(readonly fullDirectoryPath: string, readonly fileName: string, readonly sessionInfo: any) {
        this.filePath = path.resolve(this.fullDirectoryPath, this.fileName)
    }

    appendLine(line: string) {
        this.queue.push(line)

        if (this.timeout != null) {
            if (this.nextTimeoutAt - Date.now() > 250) {
                //early return;
                return;
            } else {
                clearTimeout(this.timeout);
            }
        }

        this.nextTimeoutAt = Date.now() + 700
        this.timeout = setTimeout(async () => {
            const release = await this.writeTaskMutex.acquire()
            try {
                const backendUrl = getUploadServerHostUrl()
                if (backendUrl != null) {
                    console.log("push log queue to backend server - ", this.queue.length, backendUrl)
                    await this.writeQueueToBackend(backendUrl)
                } else {
                    console.log("push log queue to file")
                    await this.writeQueueToFile()
                }
            } catch (e) {
                notifyError(e, (report) => {
                    report.errorMessage = `Error while logging`
                    report.metadata = {
                        lineToPush: line
                    }
                })
            }

            this.nextTimeoutAt = null
            this.timeout = null
            release()
        }, 700)
    }

    async prepareDirectory(): Promise<boolean> {
        if (await exists(this.fullDirectoryPath) === false) {
            try {
                await mkdir(this.fullDirectoryPath)
                return true
            } catch (ex) {
                console.log(ex)
                return false
            }
        } else return true
    }

    async writeQueueToFile(): Promise<void> {
        console.log("write a queue to file - ", this.queue.length)
        if (this.queue.length > 0) {
            const directoryPrepared = await this.prepareDirectory()
            if (directoryPrepared === true) {
                const content = "\n" + this.queue.join("\n")
                this.queue.splice(0)
                if (await exists(this.filePath) === false) {
                    await writeFile(this.filePath, content, 'utf8')
                } else {
                    //exist. append
                    await appendFile(this.filePath, content, 'utf8')
                }
                await this.writeQueueToFile()
            } else {

            }
        }
    }

    async writeQueueToBackend(host: string): Promise<void> {
        console.log("send a queue to backend - ", this.queue.length)
        if (this.queue.length > 0) {

            const result = await fetch(path.resolve(host, "logs"), {
                method: 'POST',
                headers: {
                    ...this.sessionInfo,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: this.fileName,
                    lines: this.queue
                })
            })
            if (result.status === 200) {
                console.log(`successfully uploaded ${this.queue.length} logs.`)
                this.queue.splice(0)
            } else {
                console.log(`uploading logs was unsuccessful: ${result.status}`)
            }
        }
    }
}