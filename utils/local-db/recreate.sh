docker kill splitsies-pg-expense-local
docker kill splitsies-ddb-expense-local

rm -rf utils/local-db/docker

cd utils/local-db

docker-compose -p splitsies-expense-db up -d

aws dynamodb create-table \
    --table-name Splitsies-Expense-local \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=transactionDate,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000 \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"TransactionDateIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"id\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"transactionDate\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\":{
                    \"ProjectionType\":\"ALL\"
                },
                \"BillingMode\": \"PAY_PER_REQUEST\"
            }
        ]"

aws dynamodb create-table \
    --table-name Splitsies-ExpenseConnection-local \
    --attribute-definitions \
        AttributeName=connectionId,AttributeType=S \
        AttributeName=expenseId,AttributeType=S \
    --key-schema \
        AttributeName=connectionId,KeyType=HASH \
        AttributeName=expenseId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000 \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"ExpenseIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"expenseId\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"connectionId\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\":{
                    \"ProjectionType\":\"ALL\"
                },
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]"

aws dynamodb create-table \
    --table-name Splitsies-UserExpense-local \
    --attribute-definitions \
        AttributeName=expenseId,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=expenseId,KeyType=HASH \
        AttributeName=userId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000 

aws dynamodb create-table \
    --table-name Splitsies-ExpenseJoinRequest-local \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=expenseId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=expenseId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000

aws dynamodb create-table \
    --table-name Splitsies-ExpenseItem-local \
    --attribute-definitions \
        AttributeName=expenseId,AttributeType=S \
        AttributeName=itemId,AttributeType=S \
    --key-schema \
        AttributeName=expenseId,KeyType=HASH \
        AttributeName=itemId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000

docker kill splitsies-ddb-expense-local
docker kill splitsies-pg-expense-local