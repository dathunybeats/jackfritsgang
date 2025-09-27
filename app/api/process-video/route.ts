import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

// Configure Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, localPath, text, position = 'bottom', fontColor = 'black' } = body;

    if (!localPath || !text) {
      return NextResponse.json(
        { error: 'localPath and text are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Processing video with Lambda...');

    // Read the video file from temp location
    const videoBuffer = await readFile(localPath);

    // Check file size (Lambda payload limit is 6MB, base64 adds ~33% overhead)
    if (videoBuffer.length > 4 * 1024 * 1024) { // 4MB limit for base64
      return NextResponse.json(
        { error: 'Video file too large for processing. Please use a smaller file (under 4MB).' },
        { status: 400 }
      );
    }

    const videoBase64 = videoBuffer.toString('base64');
    console.log(`Video file size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB, Base64 size: ${(videoBase64.length / 1024 / 1024).toFixed(2)}MB`);

    // Prepare Lambda payload with base64 video data
    const payload = {
      body: JSON.stringify({
        videoBase64,
        text,
        position,
        fontColor,
        filename,
      }),
    };

    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.LAMBDA_FUNCTION_NAME || 'video-text-overlay',
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);

    if (!response.Payload) {
      throw new Error('No response from Lambda function');
    }

    // Parse Lambda response
    const responseText = Buffer.from(response.Payload).toString();
    console.log('Lambda response received, status code:', JSON.parse(responseText).statusCode);
    const lambdaResult = JSON.parse(responseText);

    if (lambdaResult.statusCode !== 200) {
      let errorMessage = 'Lambda function failed';
      try {
        if (lambdaResult.body) {
          const errorBody = JSON.parse(lambdaResult.body);
          errorMessage = errorBody.error || errorMessage;
        }
      } catch (parseError) {
        console.error('Failed to parse error body:', lambdaResult.body);
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(lambdaResult.body);

    console.log('✅ Lambda processing completed successfully');

    // Return the processed video as base64 for download
    if (result.videoBase64) {
      const processedBuffer = Buffer.from(result.videoBase64, 'base64');
      console.log(`📹 Processed video ready: ${filename} (${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

      return NextResponse.json({
        success: true,
        videoBase64: result.videoBase64,
        filename: `processed-${filename}`,
        message: 'Text overlay added successfully',
      });
    } else {
      // Fallback to S3 URL if available
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        message: 'Text overlay added successfully',
      });
    }

  } catch (error) {
    console.error('❌ Process video error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}