# JackFrits - Video Text Overlay

A simple Next.js web application that adds text overlays to videos using AWS Lambda and FFmpeg.

## 🚀 Features

- **Video Upload**: Drag & drop video files (up to 100MB)
- **Text Overlay**: Add custom black text to videos
- **Position Control**: Choose from 7 different text positions
- **AWS Lambda Processing**: Server-side video processing with FFmpeg
- **Clean UI**: Simple, responsive interface

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, AWS Lambda
- **Storage**: AWS S3
- **Video Processing**: FFmpeg (via AWS Lambda)
- **File Upload**: react-dropzone

## 📁 Project Structure

```
jackfritsgang/
├── app/
│   ├── api/
│   │   ├── upload-video/     # Video upload to S3
│   │   └── process-video/    # Lambda video processing
│   ├── components/
│   │   ├── VideoUpload.tsx   # Upload & text input UI
│   │   └── VideoPlayer.tsx   # Video display & download
│   └── page.tsx              # Main page
├── aws-lambda/
│   ├── index.js              # Lambda function code
│   ├── package.json          # Lambda dependencies
│   └── README.md             # Lambda setup guide
└── .env.example              # Environment variables template
```

## 🔧 Setup Instructions

### 1. Clone & Install

```bash
git clone <repository-url>
cd jackfritsgang
npm install
```

### 2. Set up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET=your-video-bucket-name
LAMBDA_FUNCTION_NAME=video-text-overlay
```

### 3. Set up AWS Resources

#### S3 Bucket
1. Create an S3 bucket for video storage
2. Enable public read access for the bucket
3. Update the bucket name in your environment variables

#### Lambda Function
1. Navigate to the `aws-lambda/` directory
2. Follow the setup instructions in `aws-lambda/README.md`
3. Deploy the Lambda function
4. Note the function name for your environment variables

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## 📋 Usage

1. **Upload Video**: Drag & drop or click to select a video file (max 100MB)
2. **Enter Text**: Type the text you want to overlay on the video
3. **Choose Position**: Select where the text should appear
4. **Process**: Click "Add Text to Video" to start processing
5. **Download**: Once complete, view or download the processed video

## 🎯 Supported Features

### Video Formats
- MP4, MOV, AVI, MKV
- Maximum file size: 100MB

### Text Positions
- Top Center
- Center
- Bottom Center
- Top Left
- Top Right
- Bottom Left
- Bottom Right

### Text Style
- Font: Default system font
- Color: Black
- Size: 40px (configurable in Lambda)

## 🔧 Configuration

### Lambda Function Configuration
- **Runtime**: Node.js 18.x
- **Memory**: 1024MB (minimum for video processing)
- **Timeout**: 5 minutes
- **Layers**: FFmpeg layer required

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for resources | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required |
| `S3_BUCKET` | S3 bucket name | Required |
| `LAMBDA_FUNCTION_NAME` | Lambda function name | `video-text-overlay` |

## 🚧 Development

### Adding New Features

1. **New Text Styles**: Modify the FFmpeg command in `aws-lambda/index.js`
2. **Additional Positions**: Update `calculateTextPosition()` function
3. **File Format Support**: Update the dropzone accept types
4. **UI Improvements**: Modify components in `app/components/`

### Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

1. **Lambda Timeout**: Increase timeout for large videos
2. **S3 Access Denied**: Check bucket permissions and IAM roles
3. **FFmpeg Not Found**: Ensure FFmpeg layer is properly attached
4. **File Upload Fails**: Check file size and format requirements

### Debug Steps

1. Check browser console for client-side errors
2. Review Lambda CloudWatch logs for processing errors
3. Verify S3 bucket permissions
4. Confirm environment variables are set correctly

## 📄 License

This project is for educational purposes. Feel free to modify and use as needed.

---

Built with ❤️ using Next.js, AWS Lambda, and FFmpeg.
