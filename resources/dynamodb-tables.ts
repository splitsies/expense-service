export default {
    ExpensePayer: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
            TableName: "Splitsies-ExpensePayer-${param:RTENV}",
            AttributeDefinitions: [
                { AttributeName: "expenseId", AttributeType: "S" },
                { AttributeName: "userId", AttributeType: "S" },
            ],
            KeySchema: [
                { AttributeName: "expenseId", KeyType: "HASH" },
                { AttributeName: "userId", KeyType: "RANGE" },
            ],
            BillingMode: "PAY_PER_REQUEST",
        },
    },
    ExpensePayerStatus: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
            TableName: "Splitsies-ExpensePayerStatus-${param:RTENV}",
            AttributeDefinitions: [
                { AttributeName: "expenseId", AttributeType: "S" },
                { AttributeName: "userId", AttributeType: "S" },
            ],
            KeySchema: [
                { AttributeName: "expenseId", KeyType: "HASH" },
                { AttributeName: "userId", KeyType: "RANGE" },
            ],
            BillingMode: "PAY_PER_REQUEST",
        },
    },
};
