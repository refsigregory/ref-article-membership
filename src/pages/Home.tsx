import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useToaster } from '../hooks/useToaster';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  thumbnail: string;
  is_premium: boolean;
  created_at: string;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToaster();

  const { data: articles, isLoading, error } = useQuery<Article[]>({
    queryKey: ['articles'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/articles');
        return response.data?.data || [];
      } catch (err: any) {
        if (err.response?.status === 401) {
          showToast('Please log in to view articles', 'error');
          navigate('/login');
        } else if (err.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          showToast('Please subscribe to read articles', 'error');
          navigate('/pricing');
        }
        throw err;
      }
    },
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to REF ArticleHub</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your source for premium articles and videos
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-md text-lg font-medium border border-blue-600 hover:bg-blue-50"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Articles</h1>
        <p className="text-gray-600 mb-8">We're sorry, but there was an error loading the articles.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles?.map((article) => (
          <Link
            key={article.id}
            to={`/articles/${article.id}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h2>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {new Date(article.created_at).toLocaleDateString()}
                </span>
                {article.is_premium && (
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 