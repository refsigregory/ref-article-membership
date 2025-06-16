import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_published: boolean;
}

export default function VideoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    is_published: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch video data if editing
  const { data: video, isLoading: isLoadingVideo } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await window.api.get(`/api/videos/${id}`);
      return response.data;
    },
    enabled: isEditing,
  });

  // Update form data when video is loaded
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        is_published: video.is_published,
      });
    }
  }, [video]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.video_url.trim()) {
      newErrors.video_url = 'Video URL is required';
    } else if (!isValidUrl(formData.video_url)) {
      newErrors.video_url = 'Please enter a valid video URL';
    }
    
    if (!formData.thumbnail_url.trim()) {
      newErrors.thumbnail_url = 'Thumbnail URL is required';
    } else if (!isValidUrl(formData.thumbnail_url)) {
      newErrors.thumbnail_url = 'Please enter a valid thumbnail URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Create or update video mutation
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!validateForm()) {
        throw new Error('Please fix the form errors');
      }

      const response = isEditing 
        ? await window.api.put(`/api/videos/${id}`, data)
        : await window.api.post('/api/videos', data);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Video ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isLoadingVideo) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Video' : 'Create New Video'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">
            Video URL
          </label>
          <input
            type="url"
            id="video_url"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            required
            placeholder="https://example.com/video.mp4"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.video_url ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.video_url && (
            <p className="mt-1 text-sm text-red-600">{errors.video_url}</p>
          )}
        </div>

        <div>
          <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">
            Thumbnail URL
          </label>
          <input
            type="url"
            id="thumbnail_url"
            name="thumbnail_url"
            value={formData.thumbnail_url}
            onChange={handleChange}
            required
            placeholder="https://example.com/thumbnail.jpg"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.thumbnail_url ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.thumbnail_url && (
            <p className="mt-1 text-sm text-red-600">{errors.thumbnail_url}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            checked={formData.is_published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
            Publish immediately
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update Video' : 'Create Video'}
          </button>
        </div>
      </form>
    </div>
  );
} 