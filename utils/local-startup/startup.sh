sls offline start \
    --host 0.0.0.0 \
    --param='DB_ENDPOINT=http://localhost:8000/' \
    --param='APIG_URL=http://0.0.0.0:14624/' \
    --param='DELETE_EXPIRED_INTERVAL_MIN=2' \
    --param='CONNECTION_TABLE_NAME=Splitsies-ExpenseConnection-local' \
    --param='CONNECTION_TOKEN_TABLE_NAME=Splitsies-ConnectionToken-local' \
    --param='DB_TABLE_NAME=Expense' \
    --param='EXPENSE_ITEM_TABLE_NAME=Splitsies-ExpenseItem-local' \
    --param='DB_ACCESS_KEY_ID=null' \
    --param='DB_SECRET_ACCESS_KEY=null' \
    --param='DB_REGION=us-east-1' \
    --param='PGUSERNAME=postgres' \
    --param='PGPASSWORD=postgres' \
    --param='PG_HOST=127.0.0.1' \
    --param='PG_PORT=5432' \
    --param='PG_DATABASE_NAME=postgres' \
    --param='EXPENSE_UPDATE_TABLE_NAME=Splitsies-ExpenseUpdate-local' \
    --param='MESSAGE_QUEUE_RESOURCE_NAME=Splitsies-MessageQueue-local'
    