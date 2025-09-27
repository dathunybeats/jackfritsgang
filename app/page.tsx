'use client';

import { useState } from 'react';
import VideoUpload from './components/VideoUpload';
import VideoPlayer from './components/VideoPlayer';

export default function Home() {
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JackFrits Video Text Overlay
          </h1>
          <p className="text-gray-600">
            Upload a video and add custom text overlays
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <VideoUpload
              onVideoProcessed={setProcessedVideoUrl}
              onProcessingChange={setIsProcessing}
            />
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Result
            </h2>
            {isProcessing ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing video...</p>
                </div>
              </div>
            ) : processedVideoUrl ? (
              <VideoPlayer videoUrl={processedVideoUrl} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">
                  Upload a video to see the result here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
