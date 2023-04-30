import { IExpenseItem } from "@splitsies/shared-models";

export interface IExpenseDto {
    readonly id: string;
    readonly name: string;
    readonly transactionDate: string;
    readonly items: IExpenseItem[];
    readonly proportionalItems: IExpenseItem[];
}
