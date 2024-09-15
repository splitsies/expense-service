import { injectable } from "inversify";
import { IExpenseDaMapper } from "./expense-da-mapper-interface";
import { Expense } from "src/models/expense";
import { ExpenseDa } from "src/models/expense-da";

@injectable()
export class ExpenseDaMapper implements IExpenseDaMapper {
    toDomain(da: ExpenseDa): Expense {
        return new Expense(da.id, da.name, new Date(Date.parse(da.transactionDate)));
    }

    toDa(domain: Expense): ExpenseDa {
        return new ExpenseDa(domain.id, domain.name, domain.transactionDate.toISOString());
    }
}
