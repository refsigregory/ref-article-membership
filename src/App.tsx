import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/Toaster';
import { useAuth } from "./hooks/useAuth";
import { Suspense } from 'react';
import ArticleDetail from './pages/ArticleDetail';
import Videos from './pages/Videos';
import ArticleForm from './pages/ArticleForm';
import VideoForm from './pages/VideoForm';
import PlanForm from './pages/PlanForm';
import VideoDetail from './pages/VideoDetail';

const queryClient = new QueryClient();

// Root layout component
function RootLayout() {
  const { user, isLoading } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}

// Error boundary component
function ErrorBoundary() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
      <p className="text-gray-600 mb-8">We're sorry, but there was an error loading this page.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}

// Create router with future flags and error boundaries
const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          ),
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/register',
          element: <Register />,
        },
        {
          path: '/pricing',
          element: <Pricing />,
        },
        {
          path: '/dashboard',
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: '/articles/:id',
          element: (
            <ProtectedRoute>
              <ArticleDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: '/videos',
          element: (
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          ),
        },
        {
          path: '/videos/:id',
          element: (
            <ProtectedRoute>
              <VideoDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/articles/new',
          element: (
            <ProtectedRoute requireAdmin>
              <ArticleForm />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/articles/:id/edit',
          element: (
            <ProtectedRoute requireAdmin>
              <ArticleForm />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/videos/new',
          element: (
            <ProtectedRoute requireAdmin>
              <VideoForm />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/videos/:id/edit',
          element: (
            <ProtectedRoute requireAdmin>
              <VideoForm />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/plans/new',
          element: (
            <ProtectedRoute requireAdmin>
              <PlanForm />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/plans/:id/edit',
          element: (
            <ProtectedRoute requireAdmin>
              <PlanForm />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_normalizeFormMethod: true,
    },
  }
);

function App() {
  const { user, isLoading } = useAuth();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
