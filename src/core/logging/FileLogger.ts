import { CachesDirectoryPath, exists, mkdir, writeFile, appendFile, unlink } from 'react-native-fs';
import path from 'react-native-path'
import { zip } from 'react-native-zip-archive';

export class FileLogger {

    private readonly fullDirectoryPath: string

    constructor(readonly directoryPath: string) {
        this.fullDirectoryPath = path.resolve(CachesDirectoryPath, directoryPath)
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

    async appendJsonLine(filename: string, object: Object, timestamp = Date.now()): Promise<boolean>{
        const directoryPrepared = await this.prepareDirectory()
        if (directoryPrepared === true) {
            const filePath = path.resolve(this.fullDirectoryPath, filename)
            object["timestamp"] = timestamp
            const line = JSON.stringify(object)

            if(__DEV__ === true){
                console.log("Log ", line, " on ", filePath)
            }

            if (await exists(filePath) === false) {
                await writeFile(filePath, line + "\n", 'utf8')
            }else{
                //exist. append
                await appendFile(filePath, line + "\n", 'utf8')
            }
        } else {
            console.log("Something went wrong when directory creation for logger.: ", this.fullDirectoryPath)
            return false
        }
    }

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
    }

    async removeAllFilesInDirectory(): Promise<void>{
        if(await exists(this.fullDirectoryPath)=== true){
            await unlink(this.fullDirectoryPath)
        }
    }

    async zipLogs(): Promise<{filePath: string, mimeType: string} | null>{
        if(await exists(this.fullDirectoryPath) === true){
            let finalFilePath = path.resolve(CachesDirectoryPath, 'logs_' + path.basename(this.fullDirectoryPath) + '.zip')
            finalFilePath = await zip(this.fullDirectoryPath, finalFilePath)
            return {
                filePath: finalFilePath,
                mimeType: 'application/zip'
            }
        }else return null
    }
}