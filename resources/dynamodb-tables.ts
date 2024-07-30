export default {
    ExpensePayer: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
            TableName: "Splitsies-ExpensePayer-${sls:stage}",
            AttributeDefinitions: [
                { AttributeName: "expenseId", AttributeType: "S" },
                { AttributeName: "userId", AttributeType: "S" }
            ],
            KeySchema: [
                { AttributeName: "expenseId", KeyType: "HASH" },
                { AttributeName: "userId", KeyType: "RANGE" }
            ],
            BillingMode: "PAY_PER_REQUEST"
        },
    }
};