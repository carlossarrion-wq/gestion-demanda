#!/bin/bash

# IAM Authenticator Lambda Deployment Script
# This script packages and deploys the Lambda function to AWS

set -e

# Configuration
FUNCTION_NAME="gestion-demanda-iam-authenticator"
RUNTIME="python3.11"
HANDLER="iam_authenticator.lambda_handler"
ROLE_NAME="gestion-demanda-lambda-role"
REGION="eu-west-1"
TIMEOUT=30
MEMORY=256

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IAM Authenticator Lambda Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials are not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy Lambda function to temp directory
cp iam_authenticator.py "$TEMP_DIR/"

# Create deployment package
cd "$TEMP_DIR"
zip -q deployment-package.zip iam_authenticator.py

echo -e "${GREEN}✓ Deployment package created${NC}"
echo ""

# Check if IAM role exists
echo -e "${YELLOW}Step 2: Checking IAM role...${NC}"

if aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" &> /dev/null; then
    echo -e "${GREEN}✓ IAM role '$ROLE_NAME' already exists${NC}"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" --query 'Role.Arn' --output text)
else
    echo "Creating IAM role '$ROLE_NAME'..."
    
    # Create trust policy
    TRUST_POLICY='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }'
    
    # Create the role
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --region "$REGION" \
        --query 'Role.Arn' \
        --output text)
    
    echo -e "${GREEN}✓ IAM role created: $ROLE_ARN${NC}"
    
    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
        --region "$REGION"
    
    echo -e "${GREEN}✓ Attached AWSLambdaBasicExecutionRole policy${NC}"
    
    # Create and attach custom policy for IAM user tags
    POLICY_NAME="${ROLE_NAME}-policy"
    POLICY_DOCUMENT='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "iam:ListUserTags"
          ],
          "Resource": "*"
        }
      ]
    }'
    
    POLICY_ARN=$(aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --region "$REGION" \
        --query 'Policy.Arn' \
        --output text 2>/dev/null || \
        aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
    
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "$POLICY_ARN" \
        --region "$REGION"
    
    echo -e "${GREEN}✓ Attached custom IAM policy for user tags${NC}"
    
    # Wait for role to be available
    echo "Waiting for IAM role to propagate..."
    sleep 10
fi

echo ""

# Check if Lambda function exists
echo -e "${YELLOW}Step 3: Deploying Lambda function...${NC}"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "Updating existing Lambda function..."
    
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://deployment-package.zip" \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✓ Lambda function code updated${NC}"
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✓ Lambda function configuration updated${NC}"
else
    echo "Creating new Lambda function..."
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file "fileb://deployment-package.zip" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --region "$REGION" \
        --no-cli-pager > /dev/null
    
    echo -e "${GREEN}✓ Lambda function created${NC}"
fi

# Get Lambda function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

echo ""

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Function Name: ${YELLOW}$FUNCTION_NAME${NC}"
echo -e "Function ARN:  ${YELLOW}$FUNCTION_ARN${NC}"
echo -e "Region:        ${YELLOW}$REGION${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create an API Gateway REST API"
echo "2. Create a POST method that integrates with this Lambda function"
echo "3. Enable CORS on the API Gateway"
echo "4. Deploy the API to a stage (e.g., 'prod')"
echo "5. Update login.html with the API Gateway endpoint URL"
echo ""
echo -e "${YELLOW}Example API Gateway setup commands:${NC}"
echo "See api-gateway-setup.sh for automated API Gateway configuration"
echo ""
