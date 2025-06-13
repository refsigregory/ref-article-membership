import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToaster } from '../hooks/useToaster';

interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: 'PRO_READER' | 'PLUS_READER' | 'FREE';
  daily_article_limit: number;
  daily_video_limit: number;
  is_active: boolean;
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToaster();

  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await window.api.get('/api/plans');
      return response.data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await window.api.post('/api/subscriptions', { plan_id: planId });
      return response.data;
    },
    onSuccess: () => {
      showToast('Successfully subscribed!', 'success');
      navigate('/');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to subscribe';
      showToast(message, 'error');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Plans</h1>
        <p className="text-gray-600 mb-8">We're sorry, but there was an error loading the subscription plans.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const getPlanFeatures = (plan: Plan) => {
    const features = [
      plan.daily_article_limit === -1
        ? 'Unlimited article access'
        : `${plan.daily_article_limit} articles per day`,
      plan.daily_video_limit === -1
        ? 'Unlimited video access'
        : `${plan.daily_video_limit} videos per day`,
      'Access to premium content',
      'Ad-free experience',
    ];

    if (plan.type === 'PRO_READER') {
      features.push('Early access to new content');
      features.push('Priority support');
    }

    return features;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your reading needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-lg overflow-hidden ${
              plan.type === 'PRO_READER' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <ul className="space-y-4 mb-8">
                {getPlanFeatures(plan).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribeMutation.mutate(plan.id)}
                disabled={subscribeMutation.isPending || !plan.is_active}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  plan.type === 'PRO_READER'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscribeMutation.isPending
                  ? 'Processing...'
                  : plan.is_active
                  ? 'Subscribe Now'
                  : 'Coming Soon'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 