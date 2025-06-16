import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  daily_article_limit: number;
  daily_video_limit: number;
  is_active: boolean;
}

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    features: [''],
    daily_article_limit: 0,
    daily_video_limit: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch plan data if editing
  const { data: plan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plan', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await window.api.get(`/api/plans/${id}`);
      return response.data;
    },
    enabled: isEditing,
  });

  // Update form data when plan is loaded
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features.length > 0 ? plan.features : [''],
        daily_article_limit: plan.daily_article_limit,
        daily_video_limit: plan.daily_video_limit,
        is_active: plan.is_active,
      });
    }
  }, [plan]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    if (formData.daily_article_limit < -1) {
      newErrors.daily_article_limit = 'Daily article limit must be -1 or greater';
    }
    
    if (formData.daily_video_limit < -1) {
      newErrors.daily_video_limit = 'Daily video limit must be -1 or greater';
    }

    // Validate features
    const validFeatures = formData.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      newErrors.features = 'At least one feature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create or update plan mutation
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!validateForm()) {
        throw new Error('Please fix the form errors');
      }

      // Filter out empty features and prepare data
      const cleanedData = {
        ...data,
        features: data.features.filter(feature => feature.trim() !== ''),
      };

      const response = isEditing 
        ? await window.api.put(`/api/plans/${id}`, cleanedData)
        : await window.api.post('/api/plans', cleanedData);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Plan ${isEditing ? 'updated' : 'created'} successfully`);
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = value;
      // Add a new empty feature field if this is the last one and it's not empty
      if (index === prev.features.length - 1 && value.trim() !== '') {
        newFeatures.push('');
      }
      return { ...prev, features: newFeatures };
    });
    // Clear feature error if any
    if (errors.features) {
      setErrors(prev => ({ ...prev, features: '' }));
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => {
      const newFeatures = prev.features.filter((_, i) => i !== index);
      // Ensure there's always at least one feature field
      if (newFeatures.length === 0) {
        newFeatures.push('');
      }
      return { ...prev, features: newFeatures };
    });
  };

  if (isLoadingPlan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Plan' : 'Create New Plan'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Plan Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (USD)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <label htmlFor="daily_article_limit" className="block text-sm font-medium text-gray-700">
            Daily Article Limit (-1 for unlimited)
          </label>
          <input
            type="number"
            id="daily_article_limit"
            name="daily_article_limit"
            value={formData.daily_article_limit}
            onChange={handleChange}
            min="-1"
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.daily_article_limit ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.daily_article_limit && (
            <p className="mt-1 text-sm text-red-600">{errors.daily_article_limit}</p>
          )}
        </div>

        <div>
          <label htmlFor="daily_video_limit" className="block text-sm font-medium text-gray-700">
            Daily Video Limit (-1 for unlimited)
          </label>
          <input
            type="number"
            id="daily_video_limit"
            name="daily_video_limit"
            value={formData.daily_video_limit}
            onChange={handleChange}
            min="-1"
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.daily_video_limit ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.daily_video_limit && (
            <p className="mt-1 text-sm text-red-600">{errors.daily_video_limit}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          {errors.features && (
            <p className="mb-2 text-sm text-red-600">{errors.features}</p>
          )}
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder="Enter a feature"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {formData.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Plan is active
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
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
} 