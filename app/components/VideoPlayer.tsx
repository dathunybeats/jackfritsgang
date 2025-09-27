'use client';

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <div className="space-y-4">
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg shadow-sm"
        style={{ maxHeight: '400px' }}
      >
        Your browser does not support the video tag.
      </video>

      <div className="flex space-x-4">
        <a
          href={videoUrl}
          download
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-center"
        >
          Download Video
        </a>

        <button
          onClick={() => navigator.clipboard.writeText(videoUrl)}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}