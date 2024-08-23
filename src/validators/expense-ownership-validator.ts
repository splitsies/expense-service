import { inject, injectable } from "inversify";
import { IExpenseOwnershipValidator } from "./expense-ownership-validator.i";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";

@injectable()
export class ExpenseOwnershipValidator implements IExpenseOwnershipValidator {
    
    constructor(
        @inject(IUserExpenseDao) private readonly _dao: IUserExpenseDao,
    ) {}
    
    async validate(expenseId: string, userId: string): Promise<boolean> {
        return !!(await this._dao.read({ expenseId, userId }));
    }

}