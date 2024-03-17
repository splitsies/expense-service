sls offline start \
    --host 0.0.0.0 \
    --param='OCR_API_URI=http://0.0.0.0:12948/dev-pr/' \
    --param='ALGORITHMS_API_URI=http://0.0.0.0:5001/dev-pr/' \
    --param='USERS_API_URI=http://0.0.0.0:6001/dev-pr/users/' \
    --param='DB_ENDPOINT=http://localhost:8000/' \
    --param='APIG_URL=http://0.0.0.0:14624/' \
    --param='DELETE_EXPIRED_INTERVAL_MIN=2' \
    --param='CONNECTION_TABLE_NAME=Splitsies-ExpenseConnection-local' \
    --param='DB_TABLE_NAME=Splitsies-Expense-local' \
    --param='DB_USER_EXPENSE_TABLE_NAME=Splitsies-UserExpense-local' \
    --param='DB_ACCESS_KEY_ID=null' \
    --param='DB_SECRET_ACCESS_KEY=null' \
    --param='DB_REGION=us-east-1' \
    --param='DB_EXPENSE_JOIN_REQUEST_TABLE_NAME=Splitsies-ExpenseJoinRequest-local'
    