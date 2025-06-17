import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToaster } from '../hooks/useToaster';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { user } = useAuth();
  const { showToast } = useToaster();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', id],
    queryFn: async () => {
      try {
        const response = await window.api.get(`/api/articles/${id}`);
        return response.data;
      } catch (err: any) {
        if (err.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          showToast('Please subscribe to read this article', 'error');
          navigate('/pricing');
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  const errorCode = (error as any)?.response?.data?.error;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {

    if (errorCode === 'SUBSCRIPTION_REQUIRED') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h1>
          <p className="text-gray-600 mb-8">Please subscribe to read this article.</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Subscribe Now
          </button>
        </div>
      );
    }

    if (errorCode === 'DAILY_LIMIT_REACHED') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Daily Limit Reached</h1>
          <p className="text-gray-600 mb-8">You have reached the daily limit for reading articles.</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Upgrade Subscription
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Article</h1>
        <p className="text-gray-600 mb-8">We're sorry, but there was an error loading this article.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
        <p className="text-gray-600 mb-8">The article you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto">
      {article.thumbnail && (
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
      <div className="flex items-center text-gray-600 mb-8">
        <span className="mr-4">
          {new Date(article.created_at).toLocaleDateString()}
        </span>
        {article.is_premium && (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
            Premium
          </span>
        )}
      </div>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }, { inline }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  {...Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'ref'))}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>
    </article>
  );
} 