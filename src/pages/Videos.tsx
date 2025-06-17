import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToaster } from '../hooks/useToaster';
import { Link } from 'react-router-dom';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  is_premium: boolean;
  created_at: string;
  duration: string;
}

export default function Videos() {
  const { user } = useAuth();
  const { showToast } = useToaster();

  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/videos');
        return response.data?.data || [];
      } catch (err: any) {
        if (err.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          showToast('Please subscribe to watch videos', 'error');
        }
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Videos</h1>
        <p className="text-gray-600 mb-8">We're sorry, but there was an error loading the videos.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos?.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              {video.is_premium && (
                <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                  Premium
                </span>
              )}
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {video.duration}
              </span>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {video.title}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {video.description}
              </p>
              <Link
                to={`/videos/${video.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Watch Video
              </Link>
            </div>
          </div>
        ))}
      </div>
      {videos?.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Videos Available</h2>
          <p className="text-gray-600">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
} 