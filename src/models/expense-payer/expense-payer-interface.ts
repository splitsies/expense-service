export interface IExpensePayer {
    readonly expenseId: string;
    readonly userId: string;
    readonly share: number;
}

export type Key = Pick<IExpensePayer, "expenseId" | "userId">;
