const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
      videoBase64,
      videoUrl,
      text,
      position = 'bottom',
      fontSize = 40,
      fontColor = 'black',
      filename = 'input.mp4'
    } = JSON.parse(event.body || '{}');

    // Validate inputs
    if ((!videoBase64 && !videoUrl) || !text) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: (videoBase64 or videoUrl) and text'
        })
      };
    }

    console.log('📥 Processing video input...');

    let inputPath;
    if (videoBase64) {
      // Handle base64 video data
      console.log('📥 Decoding base64 video data...');
      inputPath = '/tmp/input-video.mp4';
      const videoBuffer = Buffer.from(videoBase64, 'base64');
      fs.writeFileSync(inputPath, videoBuffer);
    } else {
      // Handle video URL (fallback)
      console.log('📥 Downloading video from URL...');
      inputPath = await downloadFile(videoUrl, '/tmp/input-video.mp4');
    }

    console.log('✅ Video downloaded successfully');
    console.log('🎭 Starting text overlay...');

    // Add text overlay using FFmpeg
    const outputPath = '/tmp/output-video.mp4';
    await addTextOverlay(inputPath, outputPath, text, position, fontSize, fontColor);

    console.log('✅ Text overlay completed');
    console.log('📤 Encoding processed video...');

    // Read the processed video file and convert to base64
    const processedVideoBuffer = fs.readFileSync(outputPath);
    const processedVideoBase64 = processedVideoBuffer.toString('base64');

    console.log('✅ Video encoding completed');

    // Cleanup temp files
    cleanupFiles([inputPath, outputPath]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        videoBase64: processedVideoBase64,
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
 * Download file from URL to local path
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url} to ${outputPath}`);

    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${outputPath}`);
        resolve(outputPath);
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Clean up on error
        reject(err);
      });
    }).on('error', reject);
  });
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

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET || 'your-video-bucket',
    Key: s3Key,
    Body: fileContent,
    ContentType: 'video/mp4'
  });

  const result = await s3.send(command);
  return {
    Location: `https://${process.env.S3_BUCKET || 'your-video-bucket'}.s3.amazonaws.com/${s3Key}`,
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