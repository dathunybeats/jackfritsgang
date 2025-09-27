@echo off
echo Setting up AWS resources for JackFrits Video Text Overlay...
echo.

REM Set variables
set BUCKET_NAME=jackfrits-video-bucket-%RANDOM%
set LAMBDA_FUNCTION_NAME=video-text-overlay
set REGION=us-east-1

echo Creating S3 bucket: %BUCKET_NAME%
aws s3 mb s3://%BUCKET_NAME% --region %REGION%

echo Configuring S3 bucket for public read access...
aws s3api put-bucket-policy --bucket %BUCKET_NAME% --policy file://bucket-policy.json

echo.
echo Creating IAM role for Lambda...
aws iam create-role --role-name lambda-video-processing-role --assume-role-policy-document file://trust-policy.json

echo Attaching basic Lambda execution policy...
aws iam attach-role-policy --role-name lambda-video-processing-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo Creating custom S3 policy...
aws iam create-policy --policy-name lambda-s3-video-access --policy-document file://s3-policy.json

echo Attaching S3 policy to role...
aws iam attach-role-policy --role-name lambda-video-processing-role --policy-arn arn:aws:iam::%AWS_ACCOUNT_ID%:policy/lambda-s3-video-access

echo.
echo Preparing Lambda deployment package...
cd ..\aws-lambda
call npm install
powershell Compress-Archive -Path . -DestinationPath ..\aws-setup\lambda-function.zip -Force
cd ..\aws-setup

echo.
echo Creating Lambda function...
aws lambda create-function ^
    --function-name %LAMBDA_FUNCTION_NAME% ^
    --runtime nodejs18.x ^
    --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/lambda-video-processing-role ^
    --handler index.handler ^
    --zip-file fileb://lambda-function.zip ^
    --timeout 300 ^
    --memory-size 1024 ^
    --environment Variables="{S3_BUCKET=%BUCKET_NAME%,AWS_REGION=%REGION%}"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo S3 Bucket: %BUCKET_NAME%
echo Lambda Function: %LAMBDA_FUNCTION_NAME%
echo Region: %REGION%
echo.
echo Add these to your .env.local file:
echo S3_BUCKET=%BUCKET_NAME%
echo LAMBDA_FUNCTION_NAME=%LAMBDA_FUNCTION_NAME%
echo AWS_REGION=%REGION%
echo.
echo Note: You'll need to add the FFmpeg layer to your Lambda function manually.
echo Use the same layer from your loom.ai project.
pause