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

interface Subscription {
  id: number;
  plan: {
    id: number;
    name: string;
    type: 'PRO_READER' | 'PLUS_READER' | 'FREE';
    daily_article_limit: number;
    daily_video_limit: number;
  };
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  articles_read_today: number;
  videos_watched_today: number;
}

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToaster();

  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await window.api.get('/api/plans');
      return response.data;
    },
  });

  // Fetch current subscription if user is authenticated
  const { data: currentSubscription } = useQuery<Subscription | null>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/subscriptions/current');
        const data = response.data;
        
        return {
          id: data.id,
          plan: {
            id: data.plan.id,
            name: data.plan.name,
            type: data.plan.type,
            daily_article_limit: data.plan.daily_article_limit,
            daily_video_limit: data.plan.daily_video_limit,
          },
          status: data.is_active ? 'active' : (data.ends_at ? 'expired' : 'cancelled'),
          start_date: data.starts_at,
          end_date: data.ends_at,
          articles_read_today: data.articles_read_today || 0,
          videos_watched_today: data.videos_watched_today || 0,
        } as Subscription;
      } catch (error: any) {
        if (error.response?.status === 404 && error.response.data?.error === 'NO_ACTIVE_SUBSCRIPTION') {
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: false,
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

  const handleSubscribe = (planId: number) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', { 
        state: { from: '/pricing' },
        replace: true 
      });
      return;
    }

    // Check if user already has an active subscription
    if (currentSubscription?.status === 'active') {
      // TODO: re-show this toast when user already has an active subscription
      // showToast('You already have an active subscription', 'info');
      // return;
    }

    subscribeMutation.mutate(planId);
  };

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

  const isCurrentPlan = (plan: Plan) => {
    return currentSubscription?.status === 'active' && currentSubscription.plan.id === plan.id;
  };

  const getButtonText = (plan: Plan) => {
    if (!isAuthenticated) {
      return 'Sign in to Subscribe';
    }
    
    if (isCurrentPlan(plan)) {
      return 'Current Plan';
    }
    
    if (currentSubscription?.status === 'active') {
      return 'Switch Plan';
    }
    
    return 'Subscribe Now';
  };

  const getButtonClasses = (plan: Plan) => {
    if (isCurrentPlan(plan)) {
      return 'w-full py-3 px-4 rounded-md text-white font-medium bg-green-600 cursor-default';
    }
    
    if (plan.type === 'PRO_READER') {
      return 'w-full py-3 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    
    return 'w-full py-3 px-4 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your reading needs
        </p>
        
        {/* Show current subscription status if authenticated */}
        {isAuthenticated && currentSubscription && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Current Plan: <span className="font-semibold">{currentSubscription.plan.name}</span>
              {currentSubscription.status === 'active' && (
                <span className="ml-2 text-green-600">(Active)</span>
              )}
              {currentSubscription.status === 'expired' && (
                <span className="ml-2 text-red-600">(Expired)</span>
              )}
            </p>
          </div>
        )}

        {/* Show authentication prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Sign in to Subscribe</h3>
            <p className="text-yellow-700 mb-4">
              You need to create an account or sign in to subscribe to our plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/login', { state: { from: '/pricing' }, replace: true })}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register', { state: { from: '/pricing' }, replace: true })}
                className="bg-white text-blue-600 px-6 py-2 rounded-md border border-blue-600 hover:bg-blue-50 font-medium"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-lg overflow-hidden ${
              plan.type === 'PRO_READER' ? 'ring-2 ring-blue-500' : ''
            } ${isCurrentPlan(plan) ? 'ring-2 ring-green-500' : ''}`}
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
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribeMutation.isPending || !plan.is_active || isCurrentPlan(plan)}
                className={getButtonClasses(plan)}
              >
                {subscribeMutation.isPending
                  ? 'Processing...'
                  : plan.is_active
                  ? getButtonText(plan)
                  : 'Coming Soon'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 