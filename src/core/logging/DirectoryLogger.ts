import { CachesDirectoryPath, exists, mkdir, writeFile, appendFile, unlink } from 'react-native-fs';
import path from 'react-native-path'
import { zip } from 'react-native-zip-archive';
import { Mutex } from 'async-mutex';
import { getDeviceName, getVersion, getUniqueId } from 'react-native-device-info';
import { Platform } from 'react-native';

export class DirectoryLogger {

    readonly fullDirectoryPath: string

    private readonly fileLoggerMap = new Map<string, DebouncedFileLogger>()

    constructor(readonly directoryPath: string, readonly sessionId: string) {
        this.fullDirectoryPath = path.resolve(CachesDirectoryPath, directoryPath)
    }

    appendJsonLine(filename: string, object: any, timestamp = Date.now()) {
        object["timestamp"] = timestamp
        const line = JSON.stringify(object)

        if (this.fileLoggerMap.has(filename) === false) {
            this.fileLoggerMap.set(filename, new DebouncedFileLogger(this.fullDirectoryPath, filename))
        }

        this.fileLoggerMap.get(filename).appendLine(line)
    }
    /*
        async appendCsvFile(filename: string, columns: string[], object: { [key: string]: string | number | boolean }, timestamp = Date.now()): Promise<boolean> {
            const directoryPrepared = await this.prepareDirectory()
            if (directoryPrepared === true) {
                const filePath = path.resolve(this.fullDirectoryPath, filename)
                if (await exists(filePath) === false) {
                    await writeFile(filePath, columns.map(c => `\"${c}\"`).join(",") + ",timestamp\n", 'utf8')
                }else{
                    //exist. append
                    await appendFile(filePath, columns.map(column => {
                        const value = object[column]
                        if(value){
                            switch(typeof value){
                                case 'string':
                                    return `\"${escape(value)}\"`
                                case 'boolean':
                                case 'number':
                                    return value
                            }
                        }else return ""
                    }).join(",") + timestamp + "\n")
                }
            } else {
                console.log("Something went wrong when directory creation for logger.: ", this.fullDirectoryPath)
                return false
            }
        }*/

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
                    device: await getDeviceName(),
                    appVersion: getVersion()
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

    constructor(readonly fullDirectoryPath: string, readonly fileName: string) {
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
            await this.writeQueueToFile()
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
}