CREATE TABLE Expense (
    id              VARCHAR(36) PRIMARY KEY,
    transactionDate DATE NOT NULL,
    name            VARCHAR(60) NOT NULL
);

CREATE TABLE UserExpense (
    expenseId       VARCHAR(36) REFERENCES Expense (id),
    userId          VARCHAR(36) NOT NULL,
    pendingJoin     BOOLEAN NOT NULL,
    PRIMARY KEY(expenseId, userId)
);