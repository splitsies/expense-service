import { injectable } from "inversify";
import { UserExpense } from "src/models/user-expense/user-expense";
import { UserExpenseDa } from "src/models/user-expense-da";
import { IUserExpenseDaMapper } from "./user-expense-mapper.i";

@injectable()
export class UserExpenseDaMapper implements IUserExpenseDaMapper {
    toDomain(da: UserExpenseDa): UserExpense {
        return new UserExpense(
            da.expenseId,
            da.userId,
            da.pendingJoin,
            da.requestingUserId,
            da.createdAt ? new Date(Date.parse(da.createdAt)) : undefined,
        );
    }

    toDa(domain: UserExpense): UserExpenseDa {
        return new UserExpenseDa(
            domain.expenseId,
            domain.userId,
            domain.pendingJoin,
            domain.requestingUserId,
            domain.createdAt?.toISOString(),
        );
    }
}
