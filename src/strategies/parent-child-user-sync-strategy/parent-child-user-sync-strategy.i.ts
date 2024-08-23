export interface IParentChildUserSyncStrategy {
    sync(parentExpenseId: string): Promise<void>;
}

export const IParentChildUserSyncStrategy = Symbol.for("IParentChildUserSyncStrategy");
