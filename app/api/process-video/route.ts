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
    const { s3Key, filename, text, position = 'bottom', fontColor = 'black' } = body;

    if (!s3Key || !text) {
      return NextResponse.json(
        { error: 's3Key and text are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Processing video with Lambda...');

    // Prepare Lambda payload with S3 information
    const payload = {
      body: JSON.stringify({
        s3Key,
        s3Bucket: process.env.S3_BUCKET || 'jackfrits-video-bucket-12198',
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

    // Return the S3 URL for the processed video
    if (result.s3Url) {
      console.log(`📹 Processed video ready: ${result.s3Key}`);

      return NextResponse.json({
        success: true,
        s3Url: result.s3Url,
        s3Key: result.s3Key,
        filename: `processed-${filename}`,
        message: 'Text overlay added successfully',
      });
    } else {
      throw new Error('No S3 URL returned from Lambda');
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