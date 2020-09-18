import { Intent } from "@data-at-hand/core/speech/types"

const verbTypes: {[verbType: string]: Array<string>} = {}
verbTypes[Intent.AssignTrivial]=["set", "assign", "put", "change", "modify", "edit", "replace"]
verbTypes[Intent.Browse]=["browse", "go", "show", "explore"]
verbTypes[Intent.Compare]=["compare"]
verbTypes[Intent.Query]=["highlight", "count", "find"]

const dict: {[verb:string]: Intent} = {}
Object.keys(verbTypes).forEach(verbType => {
    verbTypes[verbType].forEach(verb=>{
        dict[verb] = verbType as Intent
    })
})

export function inferVerbType(root: string): Intent{
    console.log("infer verb type of ", root, " - ", dict[root])
    return dict[root] || Intent.AssignTrivial
}