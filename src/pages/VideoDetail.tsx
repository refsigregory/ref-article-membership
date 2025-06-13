import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_published: boolean;
  created_at: string;
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: video, isLoading, error } = useQuery<Video>({
    queryKey: ['video', id],
    queryFn: async () => {
      try {
        const response = await window.api.get(`/api/videos/${id}`);
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Handle subscription required
          toast.error('This video requires an active subscription');
          navigate('/pricing');
          throw new Error('Subscription required');
        }
        if (err.response?.status === 429) {
          // Handle daily limit reached
          toast.error('You have reached your daily video limit');
          navigate('/pricing');
          throw new Error('Daily limit reached');
        }
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Error</h2>
            <p className="mt-2 text-sm text-gray-600">Could not load video</p>
          </div>
          <div>
            <button
              onClick={() => navigate('/videos')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          <video
            src={video.video_url}
            poster={video.thumbnail_url}
            controls
            className="w-full h-full rounded-lg shadow-lg bg-black"
            controlsList="nodownload"
            playsInline
          >
            <source src={video.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
            <p className="text-sm text-gray-500">
              Published on {format(new Date(video.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate(`/admin/videos/${video.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit Video
            </button>
          )}
        </div>

        <div className="mt-6 prose prose-blue prose-lg text-gray-500">
          {video.description}
        </div>
      </div>
    </div>
  );
} 