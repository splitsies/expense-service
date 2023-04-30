sls offline start \
    --param='OCR_API_URI=http://localhost:12948/dev/' \
    --param='ALGORITHMS_API_URI=http://localhost:5001/dev/' \
    --param='DB_ACCESS_KEY_ID=local-key-id', \
    --param='DB_SECRET_ACCESS_KEY=local-secret-access-key' \
    --param='DB_REGION=us-west-2' \
    --param='DB_TABLE_NAME=Expense' \
    --param='DB_ENDPOINT=http://localhost:8000/'