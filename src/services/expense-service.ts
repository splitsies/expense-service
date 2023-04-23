import { inject, injectable } from "inversify";
import { IExpenseService } from "./expense-service-interface";
import { IExpenseEngine } from "../engines/expense-engine-interface";

@injectable()
export class ExpenseService implements IExpenseService {
  constructor(
    @inject(IExpenseEngine) private readonly _expenseEngine: IExpenseEngine
  ) {}

  createExpense(): IExpense {
    return this._expenseEngine.createExpense();
  }

  createExpenseFromImage(base64Image: string): IExpense {
    const result = null; // TODO: ocrApi.recognize(base64Image);
    return this._expenseEngine.createExpenseFromImage(result);
  }

  updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense {
    return this._expenseEngine.updateExpense(id, updated);
  }
}

export interface IExpense {
  readonly id: string;
  readonly name: string;
  readonly transactionDate: Date;
  readonly items: IExpenseItem[];
  readonly proportionalItems: IExpenseItem[];
  readonly subtotal: number;
  readonly total: number;
}

export interface IExpenseItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly owners: string[];
}

export class Expense implements IExpense {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly transactionDate: Date,
    readonly items: IExpenseItem[],
    readonly proportionalItems: IExpenseItem[]
  ) {}

  get subtotal(): number {
    return this.items.reduce((prev, curr) => prev + curr.price, 0);
  }

  get total(): number {
    return (
      this.subtotal +
      this.proportionalItems.reduce((prev, curr) => prev + curr.price, 0)
    );
  }
}

export class ExpenseItem implements IExpenseItem {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly price: number,
    readonly owners: string[]
  ) {}
}
