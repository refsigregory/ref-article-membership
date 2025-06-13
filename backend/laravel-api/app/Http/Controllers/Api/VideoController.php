<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = User::find($request->jwt_user['id']);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // If user is admin, return all videos
        if ($user->role === 'ADMIN') {
            return response()->json(Video::latest()->paginate(10));
        }

        // For regular users, check subscription
        $subscription = $user->subscriptions()->where('is_active', true)->first();
        if (!$subscription) {
            return response()->json(['message' => 'No active subscription'], 403);
        }

        $plan = $subscription->plan;
        $query = Video::where('is_published', true);

        // Apply daily limit based on plan
        if ($plan->daily_video_limit > 0) {
            $query->inRandomOrder()->limit($plan->daily_video_limit);
        }

        $videos = $query->paginate(10);
        return response()->json($videos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = User::find($request->jwt_user['id']);
        if (!$user || $user->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video_url' => 'required|string|url',
            'thumbnail_url' => 'nullable|string|url',
            'is_published' => 'boolean'
        ]);

        $video = Video::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'description' => $validated['description'] ?? null,
            'video_url' => $validated['video_url'],
            'thumbnail_url' => $validated['thumbnail_url'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'user_id' => $user->id
        ]);

        return response()->json($video, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Video $video)
    {
        $user = User::find($request->jwt_user['id']);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if (!$video->is_published && $user->role !== 'ADMIN') {
            return response()->json(['message' => 'Video not found'], 404);
        }

        // For non-admin users, check subscription and track view
        if ($user->role !== 'ADMIN') {
            $activeSubscription = $user->subscriptions()
                ->where('is_active', true)
                ->first();

            if (!$activeSubscription) {
                return response()->json([
                    'message' => 'Subscription required to view videos',
                    'error' => 'SUBSCRIPTION_REQUIRED'
                ], 403);
            }

            $dailyLimit = $activeSubscription->plan->daily_video_limit;
            $todayVideos = $user->videoViews()
                ->whereDate('created_at', today())
                ->count();

            if ($todayVideos >= $dailyLimit) {
                return response()->json([
                    'message' => 'Daily video limit reached',
                    'error' => 'DAILY_LIMIT_REACHED',
                    'limit' => $dailyLimit,
                    'used' => $todayVideos
                ], 403);
            }

            // Record the video view
            $user->videoViews()->create(['video_id' => $video->id]);
        }

        return response()->json($video);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Video $video)
    {
        $user = User::find($request->jwt_user['id']);
        if (!$user || $user->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'video_url' => 'string|url',
            'thumbnail_url' => 'nullable|string|url',
            'is_published' => 'boolean'
        ]);

        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $video->update($validated);
        return response()->json($video);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Video $video)
    {
        $user = User::find($request->jwt_user['id']);
        if (!$user || $user->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $video->delete();
        return response()->json(null, 204);
    }
}
