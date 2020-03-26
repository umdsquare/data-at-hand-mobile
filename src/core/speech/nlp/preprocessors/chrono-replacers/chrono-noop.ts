import { Parser } from "chrono-node"

export const makeNoopParser = () => {
    const parser = new Parser()
    parser.pattern = () => /./gi
    parser.extract = () => null
    return parser
}