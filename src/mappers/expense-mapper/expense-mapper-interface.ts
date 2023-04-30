import { IExpense } from "@splitsies/shared-models";
import { IExpenseDto } from "src/models/expense-dto/expense-dto-interface";
import { IDtoMapper } from "../dto-mapper-interface";

export interface IExpenseMapper extends IDtoMapper<IExpense, IExpenseDto> {}
export const IExpenseMapper = Symbol.for("IExpenseMapper");
