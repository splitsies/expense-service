import { injectable } from "inversify";
import { ILeadingExpenseMapper } from "./leading-expense-mapper.i";
import { LeadingExpense } from "src/models/leading-expense";
import { LeadingExpenseDa } from "src/models/leading-expense-da";

@injectable()
export class LeadingExpenseMapper implements ILeadingExpenseMapper {
    toDomain(domainModel: LeadingExpenseDa): LeadingExpense {
        const skPieces = domainModel.transactionDateExpenseId.split("#");

        return new LeadingExpense(domainModel.userId, new Date(Date.parse(skPieces[0])), skPieces[1]);
    }

    toDa(dtoModel: LeadingExpense): LeadingExpenseDa {
        return new LeadingExpenseDa(dtoModel.userId, `${dtoModel.transactionDate.toISOString()}#${dtoModel.expenseId}`);
    }
}
