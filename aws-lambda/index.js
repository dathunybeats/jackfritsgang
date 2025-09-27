const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configure S3 for file uploads
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * AWS Lambda function for adding text overlays to videos using FFmpeg
 */
exports.handler = async (event) => {
  console.log('🎬 Starting Lambda text overlay...', JSON.stringify(event, null, 2));

  try {
    const {
      s3Key,
      s3Bucket,
      text,
      position = 'bottom',
      fontSize = 40,
      fontColor = 'black',
      filename = 'input.mp4'
    } = JSON.parse(event.body || '{}');

    // Validate inputs
    if (!s3Key || !text) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: s3Key and text'
        })
      };
    }

    console.log('📥 Downloading video from S3...');

    // Download video from S3
    const inputPath = '/tmp/input-video.mp4';
    await downloadFromS3(s3Bucket || process.env.S3_BUCKET || 'jackfrits-video-bucket', s3Key, inputPath);

    console.log('✅ Video downloaded successfully');
    console.log('🎭 Starting text overlay...');

    // Add text overlay using FFmpeg
    const outputPath = '/tmp/output-video.mp4';
    await addTextOverlay(inputPath, outputPath, text, position, fontSize, fontColor);

    console.log('✅ Text overlay completed');
    console.log('📤 Uploading processed video to S3...');

    // Upload processed video to S3
    const processedS3Key = `processed/${Date.now()}-${filename}`;
    const s3UploadResult = await uploadToS3(outputPath, processedS3Key);

    console.log('✅ Video uploaded to S3:', processedS3Key);

    // Cleanup temp files
    cleanupFiles([inputPath, outputPath]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        s3Key: processedS3Key,
        s3Url: s3UploadResult.Location,
        message: 'Text overlay added successfully'
      })
    };

  } catch (error) {
    console.error('❌ Lambda text overlay error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Text overlay failed'
      })
    };
  }
};

/**
 * Download file from S3 to local path
 */
async function downloadFromS3(bucket, key, outputPath) {
  console.log(`📥 Downloading s3://${bucket}/${key} to ${outputPath}`);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const response = await s3.send(command);
    const stream = response.Body;

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log(`✅ Downloaded ${outputPath}`);
        resolve(outputPath);
      });

      writeStream.on('error', reject);
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('S3 download error:', error);
    throw error;
  }
}

/**
 * Add text overlay to video using FFmpeg
 */
async function addTextOverlay(inputPath, outputPath, text, position, fontSize, fontColor) {
  return new Promise((resolve, reject) => {
    console.log('🎭 Starting FFmpeg text overlay...');

    // Calculate text position
    const textPosition = calculateTextPosition(position);

    // Escape text for FFmpeg
    const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");

    const command = ffmpeg()
      .input(inputPath)
      .videoFilter(`drawtext=text='${escapedText}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${textPosition.x}:y=${textPosition.y}`)
      .audioCodec('copy')
      .videoCodec('libx264')
      .format('mp4')
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('🎬 FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`🎭 Progress: ${progress.percent || 0}%`);
      })
      .on('end', () => {
        console.log('✅ FFmpeg text overlay completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Calculate text position based on position parameter
 */
function calculateTextPosition(position) {
  const positions = {
    'top': { x: '(w-text_w)/2', y: '50' },
    'center': { x: '(w-text_w)/2', y: '(h-text_h)/2' },
    'bottom': { x: '(w-text_w)/2', y: 'h-text_h-50' },
    'top-left': { x: '50', y: '50' },
    'top-right': { x: 'w-text_w-50', y: '50' },
    'bottom-left': { x: '50', y: 'h-text_h-50' },
    'bottom-right': { x: 'w-text_w-50', y: 'h-text_h-50' }
  };

  return positions[position] || positions['bottom'];
}

/**
 * Upload file to S3
 */
async function uploadToS3(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);
  const bucketName = process.env.S3_BUCKET || 'jackfrits-video-bucket';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'video/mp4'
  });

  const result = await s3.send(command);
  return {
    Location: `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`,
    ...result
  };
}

/**
 * Cleanup temporary files
 */
function cleanupFiles(filePaths) {
  filePaths.forEach(filePath => {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Cleanup warning: ${filePath}`, error.message);
    }
  });
}