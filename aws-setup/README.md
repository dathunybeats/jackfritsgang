# AWS Setup for JackFrits Video Text Overlay

This directory contains scripts to automatically set up all required AWS resources using AWS CLI.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```
   Enter your AWS credentials, region (us-east-1 recommended), and output format (json).

2. **Required permissions**: Your AWS user needs permissions for:
   - S3 (create buckets, manage policies)
   - Lambda (create functions, manage roles)
   - IAM (create roles, policies, attach policies)

## Quick Setup

### For Windows:
```bash
cd aws-setup
setup.bat
```

### For Linux/macOS:
```bash
cd aws-setup
chmod +x deploy.sh
./deploy.sh
```

## What the scripts do:

1. **Create S3 Bucket**
   - Generates unique bucket name
   - Configures public read access for processed videos

2. **Set up IAM Role**
   - Creates Lambda execution role
   - Attaches S3 access permissions
   - Configures trust policy for Lambda

3. **Deploy Lambda Function**
   - Packages the Lambda function
   - Creates function with proper configuration
   - Sets environment variables

4. **Configure Environment**
   - Outputs environment variables for your .env.local

## Manual Steps After Running Scripts

### 1. Add FFmpeg Layer
Since you already have a working FFmpeg layer from loom.ai:

```bash
# Get your existing layer ARN from loom.ai project
aws lambda list-layers

# Add the layer to your new function
aws lambda update-function-configuration \
    --function-name video-text-overlay \
    --layers arn:aws:lambda:us-east-1:ACCOUNT:layer:ffmpeg:VERSION
```

### 2. Update .env.local
Copy the output from the script to your `.env.local` file:

```env
# From script output
S3_BUCKET=jackfrits-video-bucket-123456
LAMBDA_FUNCTION_NAME=video-text-overlay
AWS_REGION=us-east-1

# Your existing AWS credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Test the Function
```bash
# Test Lambda function
aws lambda invoke \
    --function-name video-text-overlay \
    --payload '{"body":"{\"videoUrl\":\"test\",\"text\":\"test\"}"}' \
    response.json
```

## Troubleshooting

### Common Issues:

1. **IAM Permissions Error**
   - Ensure your AWS user has admin permissions or specific IAM/Lambda/S3 permissions

2. **Role Propagation Delay**
   - Wait a few minutes after creating IAM roles before using them

3. **Bucket Name Conflicts**
   - Script generates unique names, but if it fails, try running again

4. **Lambda Layer Missing**
   - Copy the FFmpeg layer ARN from your loom.ai project
   - Use `aws lambda list-layers` to find it

### Cleanup (if needed):
```bash
# Delete Lambda function
aws lambda delete-function --function-name video-text-overlay

# Delete S3 bucket (must be empty first)
aws s3 rm s3://your-bucket-name --recursive
aws s3 rb s3://your-bucket-name

# Delete IAM role and policies
aws iam detach-role-policy --role-name lambda-video-processing-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name lambda-video-processing-role --policy-arn arn:aws:iam::ACCOUNT:policy/lambda-s3-video-access
aws iam delete-role --role-name lambda-video-processing-role
aws iam delete-policy --policy-arn arn:aws:iam::ACCOUNT:policy/lambda-s3-video-access
```

## Cost Considerations

- **S3**: ~$0.023 per GB stored + transfer costs
- **Lambda**: Free tier: 1M requests/month, then $0.20 per 1M requests
- **Data Transfer**: First 1GB/month free, then ~$0.09/GB

For testing, costs should be minimal (under $1/month).