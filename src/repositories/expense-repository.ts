import { injectable } from "inversify";
import { IExpenseRepository } from "./expense-repository-interface";

@injectable()
export class ExpenseRepository implements IExpenseRepository {}
