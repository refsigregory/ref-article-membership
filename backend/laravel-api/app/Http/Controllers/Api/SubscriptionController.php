<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Tag(
 *     name="Subscriptions",
 *     description="API Endpoints for managing user subscriptions"
 * )
 */

/**
 * @OA\Schema(
 *     schema="Subscription",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="plan_id", type="integer", example=1),
 *     @OA\Property(property="starts_at", type="string", format="date-time"),
 *     @OA\Property(property="ends_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="plan", ref="#/components/schemas/Plan")
 * )
 */
class SubscriptionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/subscriptions",
     *     summary="Get user's subscriptions",
     *     tags={"Subscriptions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of user's subscriptions",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Subscription")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            $subscriptions = $user->subscriptions()->with('plan')->get();
            return response()->json($subscriptions);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching subscriptions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/subscriptions",
     *     summary="Create a new subscription",
     *     tags={"Subscriptions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"plan_id"},
     *             @OA\Property(property="plan_id", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Subscription created successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Subscription")
     *     ),
     *     @OA\Response(response=400, description="Plan not available"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'plan_id' => 'required|exists:plans,id'
            ]);

            $user = User::findOrFail($request->jwt_user['id']);
            $plan = Plan::findOrFail($validated['plan_id']);
            
            if (!$plan->is_active) {
                return response()->json([
                    'message' => 'Plan is not available',
                    'error' => 'PLAN_INACTIVE'
                ], 400);
            }

            // Deactivate current subscription if exists
            $user->subscriptions()
                ->where('is_active', true)
                ->update(['is_active' => false, 'ends_at' => now()]);

            // Create new subscription
            $subscription = $user->subscriptions()->create([
                'plan_id' => $plan->id,
                'starts_at' => now(),
                'is_active' => true
            ]);

            return response()->json($subscription->load('plan'), 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/subscriptions/{subscription}",
     *     summary="Get subscription details",
     *     tags={"Subscriptions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="subscription",
     *         in="path",
     *         required=true,
     *         description="Subscription ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Subscription details",
     *         @OA\JsonContent(ref="#/components/schemas/Subscription")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Subscription not found")
     * )
     */
    public function show(Request $request, Subscription $subscription)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            if ($subscription->user_id !== $user->id && $user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Unauthorized to view this subscription',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            return response()->json($subscription->load('plan'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/subscriptions/{subscription}",
     *     summary="Cancel a subscription",
     *     tags={"Subscriptions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="subscription",
     *         in="path",
     *         required=true,
     *         description="Subscription ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=204, description="Subscription cancelled successfully"),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Subscription not found")
     * )
     */
    public function destroy(Request $request, Subscription $subscription)
    {
        try {
            $user = User::findOrFail($request->jwt_user['id']);
            if ($subscription->user_id !== $user->id && $user->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Unauthorized to cancel this subscription',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $subscription->update([
                'is_active' => false,
                'ends_at' => now()
            ]);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error cancelling subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/subscriptions/current",
     *     summary="Get user's current subscription",
     *     tags={"Subscriptions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Current subscription details",
     *         @OA\JsonContent(ref="#/components/schemas/Subscription")
     *     ),
     *     @OA\Response(response=404, description="No active subscription found")
     * )
     */
    public function current(Request $request)
    {
        try {
            // First check if user exists
            $user = User::find($request->jwt_user['id']);
            if (!$user) {
                return response()->json([
                    'message' => 'User not found',
                    'error' => 'USER_NOT_FOUND',
                    'user_id' => $request->jwt_user['id']
                ], 404);
            }
            
            $subscription = $user
                ->subscriptions()
                ->where('is_active', true)
                ->with(['plan' => function ($query) {
                    $query->select('id', 'name', 'type', 'daily_article_limit', 'daily_video_limit');
                }])
                ->first();

            if (!$subscription) {
                return response()->json([
                    'message' => 'No active subscription found',
                    'error' => 'NO_ACTIVE_SUBSCRIPTION',
                    'user_id' => $user->id,
                    'has_subscriptions' => $user->subscriptions()->exists()
                ], 404);
            }

            // Add usage statistics
            $subscription->articles_read_today = $user
                ->articleViews()
                ->whereDate('created_at', today())
                ->count();

            $subscription->videos_watched_today = $user
                ->videoViews()
                ->whereDate('created_at', today())
                ->count();

            return response()->json($subscription);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching current subscription',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
