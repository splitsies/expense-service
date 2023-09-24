sls offline start \
    --param='OCR_API_URI=http://localhost:12948/dev-pr/' \
    --param='ALGORITHMS_API_URI=http://localhost:5001/dev-pr/' \
    --param='DB_ENDPOINT=http://localhost:8000/' \
    --param='APIG_URL=http://localhost:14624/' \
    --param='DELETE_EXPIRED_INTERVAL_MIN=5' \
    --param='CONNECTION_TABLE_NAME=ExpenseConnection-local' \
    --param='DB_TABLE_NAME=Expense-local' \
    --param='DB_USER_EXPENSE_TABLE_NAME=Splitsies-UserExpense-local' \
    --param='DB_ACCESS_KEY_ID=null' \
    --param='DB_SECRET_ACCESS_KEY=null' \
    --param='DB_REGION=us-east-1'
    
