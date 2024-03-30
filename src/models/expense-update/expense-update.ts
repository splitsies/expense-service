import { IExpenseDto, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseUpdate } from "./expense-update-interface";

export class ExpenseUpdate implements IExpenseUpdate {
    readonly timestamp: number;
    readonly id: string;
    readonly name: string;
    readonly transactionDate: string;
    readonly items: IExpenseItem[];
    readonly userIds: string[];
    readonly ttl: number;

    constructor(expenseDto: IExpenseDto) {
        this.id = expenseDto.id;
        this.name = expenseDto.name;
        this.transactionDate = expenseDto.transactionDate;
        this.items = expenseDto.items;
        this.userIds = expenseDto.userIds;
        this.timestamp = Date.now();
        this.ttl = Date.now() + 10000;
    }
}