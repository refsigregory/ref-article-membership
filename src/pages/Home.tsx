import { useQuery } from '@tanstack/react-query';
// import { useAuth } from '../hooks/useAuth';
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
  // const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToaster();

  const { data: articles, isLoading, error } = useQuery<Article[]>({
    queryKey: ['articles'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/articles');
        return response.data?.data || [];
      } catch (err: any) {
        if (err.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          showToast('Please subscribe to read articles', 'error');
          navigate('/pricing');
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
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest Articles</h1>
        <p className="text-xl text-gray-600">
          Discover our latest insights and stories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles?.map((article) => (
          <article
            key={article.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {new Date(article.created_at).toLocaleDateString()}
                </span>
                {article.is_premium && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                    Premium
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {article.title}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {article.excerpt}
              </p>
              <Link
                to={`/articles/${article.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Read More
              </Link>
            </div>
          </article>
        ))}
      </div>

      {articles?.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Articles Available</h2>
          <p className="text-gray-600">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
} 