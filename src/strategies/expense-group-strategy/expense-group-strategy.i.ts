export interface IExpenseGroupStrategy {
    addExpenseToGroup(parentExpenseId: string, childExpenseId: string): Promise<void>;
    removeExpenseFromGroup(parentExpenseId: string, childExpenseId: string): Promise<void>;
}
export const IExpenseGroupStrategy = Symbol.for("IExpenseGroupStrategy");
