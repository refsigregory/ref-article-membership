<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Schema(
 *     schema="Plan",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Pro Reader"),
 *     @OA\Property(property="description", type="string", example="Access to all premium content"),
 *     @OA\Property(property="type", type="string", enum={"PRO_READER", "PLUS_READER", "FREE"}, example="PRO_READER"),
 *     @OA\Property(property="daily_article_limit", type="integer", example=10),
 *     @OA\Property(property="daily_video_limit", type="integer", example=5),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class PlanController extends Controller
{
    /**
     * @OA\Tag(
     *     name="Plans",
     *     description="API Endpoints for managing subscription plans"
     * )
     */
    public function index()
    {
        try {
            $plans = Plan::where('is_active', true)->get();
            return response()->json($plans);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching plans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/plans",
     *     summary="Create a new plan",
     *     tags={"Plans"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "type", "daily_article_limit", "daily_video_limit"},
     *             @OA\Property(property="name", type="string", example="Pro Reader"),
     *             @OA\Property(property="description", type="string", example="Access to all premium content"),
     *             @OA\Property(property="type", type="string", enum={"PRO_READER", "PLUS_READER", "FREE"}, example="PRO_READER"),
     *             @OA\Property(property="daily_article_limit", type="integer", example=10),
     *             @OA\Property(property="daily_video_limit", type="integer", example=5),
     *             @OA\Property(property="is_active", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Plan created successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Plan")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(Request $request)
    {
        try {
            if (Auth::user()->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can create plans',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:PRO_READER,PLUS_READER,FREE',
                'price' => 'required|numeric|min:0',
                'daily_article_limit' => 'required|integer|min:-1',
                'daily_video_limit' => 'required|integer|min:-1',
                'is_active' => 'boolean',
                'features' => 'array',
                'features.*' => 'string|max:255'
            ]);

            // Create slug from name
            $validated['slug'] = Str::slug($validated['name']);

            // Store features as JSON
            if (isset($validated['features'])) {
                $validated['features'] = json_encode(array_filter($validated['features']));
            }

            $plan = Plan::create($validated);
            return response()->json($plan, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/plans/{plan}",
     *     summary="Get plan details",
     *     tags={"Plans"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="plan",
     *         in="path",
     *         required=true,
     *         description="Plan ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Plan details",
     *         @OA\JsonContent(ref="#/components/schemas/Plan")
     *     ),
     *     @OA\Response(response=404, description="Plan not found")
     * )
     */
    public function show(Plan $plan)
    {
        try {
            if (!$plan->is_active && Auth::user()->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Plan not found',
                    'error' => 'PLAN_NOT_FOUND'
                ], 404);
            }

            // Decode features from JSON if they exist
            if ($plan->features) {
                $plan->features = json_decode($plan->features, true) ?? [];
            }

            return response()->json($plan);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/plans/{plan}",
     *     summary="Update a plan",
     *     tags={"Plans"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="plan",
     *         in="path",
     *         required=true,
     *         description="Plan ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Updated Pro Reader"),
     *             @OA\Property(property="description", type="string", example="Updated description"),
     *             @OA\Property(property="type", type="string", enum={"PRO_READER", "PLUS_READER", "FREE"}),
     *             @OA\Property(property="daily_article_limit", type="integer", example=15),
     *             @OA\Property(property="daily_video_limit", type="integer", example=8),
     *             @OA\Property(property="is_active", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Plan updated successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Plan")
     *     ),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Plan not found"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(Request $request, Plan $plan)
    {
        try {
            if (Auth::user()->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can update plans',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:PRO_READER,PLUS_READER,FREE',
                'price' => 'required|numeric|min:0',
                'daily_article_limit' => 'required|integer|min:-1',
                'daily_video_limit' => 'required|integer|min:-1',
                'is_active' => 'boolean',
                'features' => 'array',
                'features.*' => 'string|max:255'
            ]);

            // Update slug if name changed
            if ($validated['name'] !== $plan->name) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            // Store features as JSON
            if (isset($validated['features'])) {
                $validated['features'] = json_encode(array_filter($validated['features']));
            }

            $plan->update($validated);
            
            // Decode features for response
            if ($plan->features) {
                $plan->features = json_decode($plan->features, true) ?? [];
            }

            return response()->json($plan);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/plans/{plan}",
     *     summary="Deactivate a plan",
     *     tags={"Plans"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="plan",
     *         in="path",
     *         required=true,
     *         description="Plan ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=204, description="Plan deactivated successfully"),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=404, description="Plan not found")
     * )
     */
    public function destroy(Plan $plan)
    {
        try {
            if (Auth::user()->role !== 'ADMIN') {
                return response()->json([
                    'message' => 'Only administrators can deactivate plans',
                    'error' => 'UNAUTHORIZED'
                ], 403);
            }

            $plan->update(['is_active' => false]);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deactivating plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
