#!/bin/bash

# API Gateway Setup Script for IAM Authenticator
# This script creates and configures an API Gateway REST API for the Lambda function

set -e

# Configuration
API_NAME="gestion-demanda-auth-api"
FUNCTION_NAME="gestion-demanda-iam-authenticator"
REGION="eu-west-1"
STAGE_NAME="prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}API Gateway Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get Lambda function ARN
echo -e "${YELLOW}Step 1: Getting Lambda function details...${NC}"
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

echo -e "${GREEN}✓ Lambda ARN: $FUNCTION_ARN${NC}"
echo ""

# Check if API already exists
echo -e "${YELLOW}Step 2: Checking for existing API...${NC}"
API_ID=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo "Creating new REST API..."
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "Authentication API for Gestion Demanda" \
        --region "$REGION" \
        --endpoint-configuration types=REGIONAL \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✓ API created: $API_ID${NC}"
else
    echo -e "${GREEN}✓ Using existing API: $API_ID${NC}"
fi

echo ""

# Get root resource ID
echo -e "${YELLOW}Step 3: Configuring API resources...${NC}"
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?path==`/`].id' --output text)

# Create /auth resource if it doesn't exist
AUTH_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/auth'].id" --output text)

if [ -z "$AUTH_RESOURCE_ID" ]; then
    AUTH_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "auth" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✓ Created /auth resource${NC}"
else
    echo -e "${GREEN}✓ /auth resource already exists${NC}"
fi

# Create /auth/login resource if it doesn't exist
LOGIN_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/auth/login'].id" --output text)

if [ -z "$LOGIN_RESOURCE_ID" ]; then
    LOGIN_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$AUTH_RESOURCE_ID" \
        --path-part "login" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✓ Created /auth/login resource${NC}"
else
    echo -e "${GREEN}✓ /auth/login resource already exists${NC}"
fi

echo ""

# Create OPTIONS method for CORS
echo -e "${YELLOW}Step 4: Configuring CORS...${NC}"

# Check if OPTIONS method exists
if ! aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$LOGIN_RESOURCE_ID" --http-method OPTIONS --region "$REGION" &> /dev/null; then
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$LOGIN_RESOURCE_ID" \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    # Create OPTIONS method response
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$LOGIN_RESOURCE_ID" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    # Create OPTIONS integration
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$LOGIN_RESOURCE_ID" \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    # Create OPTIONS integration response
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$LOGIN_RESOURCE_ID" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✓ CORS OPTIONS method configured${NC}"
else
    echo -e "${GREEN}✓ CORS OPTIONS method already exists${NC}"
fi

echo ""

# Create POST method
echo -e "${YELLOW}Step 5: Configuring POST method...${NC}"

# Check if POST method exists
if ! aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$LOGIN_RESOURCE_ID" --http-method POST --region "$REGION" &> /dev/null; then
    # Create POST method
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$LOGIN_RESOURCE_ID" \
        --http-method POST \
        --authorization-type NONE \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✓ POST method created${NC}"
else
    echo -e "${GREEN}✓ POST method already exists${NC}"
fi

# Create Lambda integration
URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${FUNCTION_ARN}/invocations"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$LOGIN_RESOURCE_ID" \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$URI" \
    --region "$REGION" \
    --no-cli-pager > /dev/null

echo -e "${GREEN}✓ Lambda integration configured${NC}"

# Grant API Gateway permission to invoke Lambda
STATEMENT_ID="apigateway-invoke-${API_ID}"
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "$STATEMENT_ID" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region "$REGION" \
    --no-cli-pager > /dev/null 2>&1 || echo -e "${YELLOW}Note: Permission may already exist${NC}"

echo -e "${GREEN}✓ Lambda invoke permission granted${NC}"

echo ""

# Deploy API
echo -e "${YELLOW}Step 6: Deploying API to ${STAGE_NAME} stage...${NC}"

aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --description "Deployment for IAM authentication" \
    --region "$REGION" \
    --no-cli-pager > /dev/null

echo -e "${GREEN}✓ API deployed to ${STAGE_NAME} stage${NC}"

echo ""

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/auth/login"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}API Gateway Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "API ID:       ${YELLOW}$API_ID${NC}"
echo -e "Stage:        ${YELLOW}$STAGE_NAME${NC}"
echo -e "Region:       ${YELLOW}$REGION${NC}"
echo ""
echo -e "${GREEN}API Endpoint:${NC}"
echo -e "${YELLOW}$API_ENDPOINT${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update login.html with the API endpoint:"
echo "   Replace: const AUTH_ENDPOINT = 'YOUR_API_GATEWAY_ENDPOINT_HERE';"
echo "   With:    const AUTH_ENDPOINT = '$API_ENDPOINT';"
echo ""
echo "2. Test the authentication endpoint:"
echo "   curl -X POST $API_ENDPOINT \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"access_key\":\"YOUR_KEY\",\"secret_key\":\"YOUR_SECRET\"}'"
echo ""
