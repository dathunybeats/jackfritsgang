'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploadProps {
  onVideoProcessed: (url: string) => void;
  onProcessingChange: (processing: boolean) => void;
}

export default function VideoUpload({ onVideoProcessed, onProcessingChange }: VideoUploadProps) {
  const [text, setText] = useState('');
  const [position, setPosition] = useState('bottom');
  const [fontColor, setFontColor] = useState('black');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size <= 100 * 1024 * 1024) { // 100MB limit
        setUploadedFile(file);
      } else {
        alert('File size must be under 100MB');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const processVideo = async () => {
    if (!uploadedFile || !text.trim()) {
      alert('Please upload a video and enter text');
      return;
    }

    try {
      onProcessingChange(true);

      // First upload video to a temporary URL (you'll need to implement this)
      const formData = new FormData();
      formData.append('video', uploadedFile);

      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const { videoUrl } = await uploadResponse.json();

      // Then process with Lambda
      const processResponse = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl,
          text,
          position,
          fontColor
        })
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process video');
      }

      const result = await processResponse.json();
      console.log('Process response:', result);

      if (result.success && result.videoUrl) {
        onVideoProcessed(result.videoUrl);
      } else {
        throw new Error(result.error || 'Failed to get processed video URL');
      }

    } catch (error) {
      console.error('Error processing video:', error);
      alert('Failed to process video. Please try again.');
    } finally {
      onProcessingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Upload & Configure</h2>

      {/* File Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {uploadedFile ? (
          <div>
            <p className="text-green-600 font-medium">✓ {uploadedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the video here...'
                : 'Drag & drop a video here, or click to select'
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports MP4, MOV, AVI, MKV (max 100MB)
            </p>
          </div>
        )}
      </div>

      {/* Text Input */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
          Text to add
        </label>
        <input
          type="text"
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Position Selection */}
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
          Text Position
        </label>
        <select
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="top">Top Center</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      {/* Font Color Selection */}
      <div>
        <label htmlFor="fontColor" className="block text-sm font-medium text-gray-700 mb-2">
          Text Color
        </label>
        <select
          id="fontColor"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="black">Black</option>
          <option value="white">White</option>
        </select>
      </div>

      {/* Process Button */}
      <button
        onClick={processVideo}
        disabled={!uploadedFile || !text.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Add Text to Video
      </button>
    </div>
  );
}