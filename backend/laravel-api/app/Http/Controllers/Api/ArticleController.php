<?php

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Article Membership API",
 *     description="API for managing articles and subscriptions",
 *     @OA\Contact(
 *         email="admin@example.com"
 *     )
 * )
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Tag(
 *     name="Articles",
 *     description="API Endpoints for managing articles"
 * )
 */
class ArticleController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/articles",
     *     summary="Get list of articles",
     *     tags={"Articles"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of articles",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Article")),
     *             @OA\Property(property="links", type="object"),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Unauthorized or subscription required"),
     *     @OA\Response(response=404, description="User not found")
     * )
     */
    public function index(Request $request)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);

            $query = Article::query();

            if ($user->role !== 'ADMIN') {
                $activeSubscription = $user->subscriptions()
                    ->where('is_active', true)
                    ->first();

                if (!$activeSubscription) {
                    return response()->json([
                        'message' => 'Active subscription required to view articles',
                        'error' => 'SUBSCRIPTION_REQUIRED'
                    ], 403);
                }

                /*
                // no daily limit for listing
                $dailyLimit = $activeSubscription->plan->daily_article_limit;
                $todayArticles = $user->articleViews()
                    ->whereDate('created_at', today())
                    ->count();

                if ($dailyLimit > 0 && $todayArticles >= $dailyLimit) {
                    return response()->json([
                        'message' => 'Daily article limit reached',
                        'error' => 'DAILY_LIMIT_REACHED',
                        'limit' => $dailyLimit,
                        'used' => $todayArticles
                    ], 403);
                } */
            }

            $articles = $query->latest()->paginate(10);
            return response()->json($articles);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching articles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/articles",
     *     summary="Create a new article",
     *     tags={"Articles"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title", "content"},
     *             @OA\Property(property="title", type="string", example="Article Title"),
     *             @OA\Property(property="content", type="string", example="Article content..."),
     *             @OA\Property(property="featured_image", type="string", example="https://example.com/image.jpg"),
     *             @OA\Property(property="is_published", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Article created successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Article")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(Request $request)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            
            if ($user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can create articles',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string|min:10',
                'featured_image' => 'nullable|string',
                'is_published' => 'boolean'
            ]);

            // Generate slug from title
            $validated['slug'] = Str::slug($validated['title']);
            $validated['user_id'] = $user->id;

            $article = Article::create($validated);
            return response()->json($article, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/articles/{article}",
     *     summary="Get article details",
     *     tags={"Articles"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="article",
     *         in="path",
     *         required=true,
     *         description="Article ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Article details",
     *         @OA\JsonContent(ref="#/components/schemas/Article")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized or subscription required"),
     *     @OA\Response(response=404, description="Article or user not found")
     * )
     */
    public function show(Request $request, Article $article)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);

            if (!$article->is_published && $user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'This article is not published yet',
                    'error' => 'ARTICLE_NOT_PUBLISHED'
                ], 403);
            }

            if ($user->role !== 'ADMIN') {
                $activeSubscription = $user->subscriptions()
                    ->where('is_active', true)
                    ->first();

                if (!$activeSubscription) {
                    return response()->json([
                        'message' => 'Subscription required to view articles',
                        'error' => 'SUBSCRIPTION_REQUIRED'
                    ], 403);
                }

                $dailyLimit = $activeSubscription->plan->daily_article_limit;
                $todayArticles = $user->articleViews()
                    ->whereDate('created_at', today())
                    ->count();

                if ($dailyLimit > 0 && $todayArticles >= $dailyLimit) {
                    return response()->json([
                        'message' => 'Daily article limit reached',
                        'error' => 'DAILY_LIMIT_REACHED',
                        'limit' => $dailyLimit,
                        'used' => $todayArticles
                    ], 403);
                }

                // Record the article view
                $user->articleViews()->create(['article_id' => $article->id]);
            }

            return response()->json($article);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/articles/{article}",
     *     summary="Update an article",
     *     tags={"Articles"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="article",
     *         in="path",
     *         required=true,
     *         description="Article ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="title", type="string", example="Updated Title"),
     *             @OA\Property(property="content", type="string", example="Updated content..."),
     *             @OA\Property(property="featured_image", type="string", example="https://example.com/updated-image.jpg"),
     *             @OA\Property(property="is_published", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Article updated successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Article")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Article not found"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(Request $request, Article $article)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            
            if ($user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can update articles',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $validated = $request->validate([
                'title' => 'string|max:255',
                'content' => 'string|min:10',
                'featured_image' => 'nullable|string',
                'is_published' => 'boolean'
            ]);

            $article->update($validated);
            return response()->json($article);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/articles/{article}",
     *     summary="Delete an article",
     *     tags={"Articles"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="article",
     *         in="path",
     *         required=true,
     *         description="Article ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=204, description="Article deleted successfully"),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Article not found")
     * )
     */
    public function destroy(Request $request, Article $article)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            
            if ($user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can delete articles',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $article->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting article',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

/**
 * @OA\Schema(
 *     schema="Article",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="title", type="string", example="Article Title"),
 *     @OA\Property(property="content", type="string", example="Article content..."),
 *     @OA\Property(property="featured_image", type="string", example="https://example.com/image.jpg"),
 *     @OA\Property(property="is_published", type="boolean", example=false),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */

/**
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
