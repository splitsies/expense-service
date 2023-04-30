import { IExpenseItem } from "@splitsies/shared-models";

export interface IExpenseUpdate {
    readonly name: string;
    readonly transactionDate: string;
    readonly items: IExpenseItem[];
    readonly proportionalItems: IExpenseItem[];
}