docker kill splitsies-expense-db-local

rm -rf utils/local-db/docker

cd utils/local-db

docker-compose -p splitsies-expense-db up -d

aws dynamodb create-table \
    --table-name Expense-local \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000


aws dynamodb create-table \
    --table-name ExpenseConnection-local \
    --attribute-definitions \
        AttributeName=connectionId,AttributeType=S \
        AttributeName=expenseId,AttributeType=S \
    --key-schema \
        AttributeName=connectionId,KeyType=HASH \
        AttributeName=expenseId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000

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

docker kill splitsies-expense-db-local