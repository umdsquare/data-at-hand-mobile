export abstract class SourceDependency{
    
    abstract resolved(): Promise<boolean>
    abstract tryResolve(): Promise<boolean>
}