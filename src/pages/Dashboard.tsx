import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToaster } from '../hooks/useToaster';
import { Link } from 'react-router-dom';

interface Article {
  id: number;
  title: string;
  content: string;
  is_premium: boolean;
  created_at: string;
}

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_published: boolean;
  created_at: string;
}

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

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No {type}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new {type.toLowerCase()}.
      </p>
      <div className="mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create {type.slice(0, -1)}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToaster();
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'plans'>('articles');
  const navigate = useNavigate();

  // Move role check to useEffect
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Only make admin requests if user is admin
  const isAdmin = user?.role === 'ADMIN';

  const { data: articles, isLoading: articlesLoading, error: articlesError } = useQuery<Article[]>({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const response = await window.api.get('/api/articles');
      return response.data?.data || [];
    },
    enabled: isAdmin && activeTab === 'articles',
  });

  const { data: videos, isLoading: videosLoading, error: videosError } = useQuery<Video[]>({
    queryKey: ['admin-videos'],
    queryFn: async () => {
      const response = await window.api.get('/api/videos');
      return response.data?.data || [];
    },
    enabled: isAdmin && activeTab === 'videos',
  });

  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await window.api.get('/api/plans');
      return response.data || [];
    },
    enabled: isAdmin && activeTab === 'plans',
  });

  const { data: subscriptionData, isLoading: subscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/subscriptions/current');
        const data = response.data;
        
        // Transform the data to match the expected interface
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
        // Handle specific error cases
        if (error.response?.status === 404) {
          if (error.response.data?.error === 'USER_NOT_FOUND') {
            throw new Error('User account not found. Please log in again.');
          }
          if (error.response.data?.error === 'NO_ACTIVE_SUBSCRIPTION') {
            // Return null instead of throwing for no subscription
            return null;
          }
        }
        throw error;
      }
    },
    enabled: !!user, // Only fetch if user is logged in
    retry: false, // Don't retry on 404 errors
  });

  const isLoading = articlesLoading || videosLoading || plansLoading || subscriptionLoading;
  const error = articlesError || videosError || plansError || subscriptionError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    showToast(errorMessage, 'error');
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h1>
        <p className="text-gray-600 mb-8">{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // If not admin, show subscription-only view
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-gray-600">Here's an overview of your subscription and usage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h2>
            {subscriptionData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Plan</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(subscriptionData.plan.type)}`}>
                    {subscriptionData.plan.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscriptionData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="text-gray-900">
                    {new Date(subscriptionData.start_date).toLocaleDateString()}
                  </span>
                </div>
                {subscriptionData.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">End Date</span>
                    <span className="text-gray-900">
                      {new Date(subscriptionData.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscriptionData.status !== 'active' && (
                  <Link
                    to="/pricing"
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4"
                  >
                    Renew Subscription
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">You don't have an active subscription.</p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Plans
                </Link>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          {subscriptionData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Usage</h2>
              <div className="space-y-6">
                {/* Articles Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Articles Read</span>
                    <span className="text-gray-900">
                      {subscriptionData.articles_read_today} / {subscriptionData.plan.daily_article_limit === -1 ? '∞' : subscriptionData.plan.daily_article_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${getUsagePercentage(
                          subscriptionData.articles_read_today,
                          subscriptionData.plan.daily_article_limit
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Videos Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Videos Watched</span>
                    <span className="text-gray-900">
                      {subscriptionData.videos_watched_today} / {subscriptionData.plan.daily_video_limit === -1 ? '∞' : subscriptionData.plan.daily_video_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${getUsagePercentage(
                          subscriptionData.videos_watched_today,
                          subscriptionData.plan.daily_video_limit
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/"
                    className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                  >
                    Browse Content
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  const getPlanColor = (type: string) => {
    switch (type) {
      case 'PRO_READER':
        return 'bg-blue-100 text-blue-800';
      case 'PLUS_READER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your content and subscriptions.</p>
      </div>

      {/* Content Management Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 mb-6">
            <button
              className={`px-4 py-2 rounded font-medium transition ${activeTab === 'articles' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none'}`}
              onClick={() => setActiveTab('articles')}
            >
              Articles
            </button>
            <button
              className={`px-4 py-2 rounded font-medium transition ${activeTab === 'videos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none'}`}
              onClick={() => setActiveTab('videos')}
            >
              Videos
            </button>
            <button
              className={`px-4 py-2 rounded font-medium transition ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none'}`}
              onClick={() => setActiveTab('plans')}
            >
              Plans
            </button>
          </nav>
        </div>
      </div>

      {/* Content Management Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'articles' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Articles</h2>
              <Link
                to="/admin/articles/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Article
              </Link>
            </div>
            {articles && articles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                      <tr key={article.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{article.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            article.is_premium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {article.is_premium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/admin/articles/${article.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {/* TODO: Implement delete */}}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 border-none shadow-none"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState type="Articles" />
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
              <Link
                to="/admin/videos/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Video
              </Link>
            </div>
            {videos && videos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videos.map((video) => (
                      <tr key={video.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{video.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            video.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {video.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(video.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/admin/videos/${video.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {/* TODO: Implement delete */}}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 border-none shadow-none"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState type="Videos" />
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
              <Link
                to="/admin/plans/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Plan
              </Link>
            </div>
            {plans && plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-white border rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Daily Article Limit</span>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {plan.daily_article_limit === -1 ? 'Unlimited' : plan.daily_article_limit}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Daily Video Limit</span>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {plan.daily_video_limit === -1 ? 'Unlimited' : plan.daily_video_limit}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <Link
                          to={`/admin/plans/${plan.id}/edit`}
                          className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          Edit Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState type="Plans" />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 