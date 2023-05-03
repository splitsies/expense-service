sls offline start \
    --param='OCR_API_URI=http://localhost:12948/dev/' \
    --param='ALGORITHMS_API_URI=http://localhost:5001/dev/' \
    --param='DB_ENDPOINT=http://localhost:8000/' \
    --param='APIG_URL=http://localhost:14624/' \
    --param='DELETE_EXPIRED_INTERVAL_MIN=5' \
    --param='CONNECTION_TABLE_NAME=ExpenseConnection-local' \
    --param='DB_TABLE_NAME=Expense-local'
