export class ExpenseGroupAssociationDa { 
    constructor(
        readonly groupId: string,
        readonly expenseId: string,
    ) {}
}