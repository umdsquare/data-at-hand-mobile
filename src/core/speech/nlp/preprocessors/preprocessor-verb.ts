import { VerbType } from "../types";

const verbTypes: {[verbType: string]: Array<string>} = {}
verbTypes[VerbType.AssignTrivial]=["set", "assign", "put", "change", "modify", "edit", "replace"]
verbTypes[VerbType.Browse]=["browse", "go", "show", "explore"]
verbTypes[VerbType.Compare]=["compare"]
verbTypes[VerbType.Highlight]=["highlight", "count"]

const dict: {[verb:string]: VerbType} = {}
Object.keys(verbTypes).forEach(verbType => {
    verbTypes[verbType].forEach(verb=>{
        dict[verb] = verbType as VerbType
    })
})

export function inferVerbType(root: string): VerbType{
    console.log("infer verb type of ", root)
    return dict[root] || VerbType.AssignTrivial
}