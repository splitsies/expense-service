export interface IParentChildUserSyncStrategy {
    sync(parentExpenseId: string, transaction?: Promise<boolean>): Promise<void>;
}

export const IParentChildUserSyncStrategy = Symbol.for("IParentChildUserSyncStrategy");
