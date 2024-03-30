import { IExpenseDto } from "@splitsies/shared-models";

export interface IExpenseUpdate extends IExpenseDto {
    readonly timestamp: number;
    readonly ttl: number;
}