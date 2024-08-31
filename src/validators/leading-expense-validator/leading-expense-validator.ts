import { inject, injectable } from "inversify";
import { ILeadingExpenseValidator } from "./leading-expense-validator.i";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { InvalidStateError } from "src/models/error/invalid-state-error";

@injectable()
export class LeadingExpenseValidator implements ILeadingExpenseValidator {
    constructor(@inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao) {}

    async validate(expenseId: string): Promise<boolean> {
        const hasParent = !!(await this._expenseGroupDao.getParentExpenseId(expenseId));
        if (hasParent) {
            throw new InvalidStateError("Could not edit a non-leading expense");
        }

        return !hasParent;
    }
}
