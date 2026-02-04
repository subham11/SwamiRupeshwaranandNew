#!/bin/bash

# Script to create DynamoDB table for local development

echo "Creating DynamoDB table for local development..."

aws dynamodb create-table \
    --table-name swami-rupeshwaranand-api-local-main \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"GSI1\",
            \"KeySchema\": [{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
        }]" \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000 \
    --region ap-south-1

echo "Table created successfully!"

# List tables to verify
echo "Listing tables..."
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-south-1
