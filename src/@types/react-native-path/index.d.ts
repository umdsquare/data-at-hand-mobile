declare module 'react-native-path' {

    export interface PathObject {
        dir?: string
        root?: string
        base?: string
        name?: string
        ext?: string
    }

    function normalize(path: string): string
    function basename(path: string, ext?: string): string
    function dirname(path: string): string
    function extname(path: string): string
    function format(options: PathObject): string
    function isAbsolute(path: string): boolean
    function parse(path: string): string
    function resolve(...paths: string[]): string
    function relative(from: string, to: string): string
}