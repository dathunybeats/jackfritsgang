# Video Text Overlay Lambda Function

This AWS Lambda function adds text overlays to videos using FFmpeg.

## Setup Instructions

### 1. Create FFmpeg Layer (if you don't have one)

You can reuse the FFmpeg layer from your loom.ai project or create a new one:

```bash
# Download FFmpeg for Lambda
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mkdir -p layer/bin
cp ffmpeg-*/ffmpeg layer/bin/
zip -r ffmpeg-layer.zip layer/
```

### 2. Deploy the Lambda Function

```bash
# Install dependencies
cd aws-lambda
npm install

# Create deployment package
zip -r video-text-overlay.zip . -x "*.md" "*.git*"

# Upload to AWS Lambda via AWS CLI or Console
```

### 3. Configure Environment Variables

Set these environment variables in your Lambda function:

- `S3_BUCKET_NAME`: Your S3 bucket for storing processed videos

### 4. Set Lambda Configuration

- **Runtime**: Node.js 18.x or later
- **Memory**: 1024MB (minimum for video processing)
- **Timeout**: 5 minutes
- **Layers**: Add your FFmpeg layer

### 5. IAM Permissions

Your Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## API Usage

### Request Format

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "text": "Your text here",
  "position": "bottom" // optional: "top", "center", "bottom"
}
```

### Response Format

```json
{
  "success": true,
  "videoUrl": "https://presigned-s3-url.com",
  "message": "Text overlay added successfully"
}
```