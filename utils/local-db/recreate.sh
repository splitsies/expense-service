docker kill splitsies-expense-db-local

rm -rf utils/local-db/docker

cd utils/local-db

docker-compose up -d

aws dynamodb create-table \
    --table-name Expense \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --table-class STANDARD \
    --endpoint-url http://localhost:8000

docker kill splitsies-expense-db-local