<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\SocialLoginController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\JwtMiddleware;
use App\Http\Middleware\CheckRole;

// Social Authentication Routes
Route::prefix('auth')->group(function () {
    // Google Routes
    Route::get('google/redirect', [SocialLoginController::class, 'redirectToGoogle']);
    Route::get('google/callback', [SocialLoginController::class, 'handleGoogleCallback']);

    // Facebook Routes
    Route::get('facebook/redirect', [SocialLoginController::class, 'redirectToFacebook']);
    Route::get('facebook/callback', [SocialLoginController::class, 'handleFacebookCallback']);
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware([JwtMiddleware::class])->group(function () {
    // Auth routes
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Article routes - public access
    Route::get('/articles', [ArticleController::class, 'index']);
    Route::get('/articles/{article}', [ArticleController::class, 'show']);

    // Video routes - public access
    Route::get('/videos', [VideoController::class, 'index']);
    Route::get('/videos/{video}', [VideoController::class, 'show']);

    // Plan routes
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/plans/{plan}', [PlanController::class, 'show']);

    // Subscription routes
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy']);

    // Admin only routes
    Route::middleware([CheckRole::class.':ADMIN'])->group(function () {
        // Article management
        Route::post('/articles', [ArticleController::class, 'store']);
        Route::put('/articles/{article}', [ArticleController::class, 'update']);
        Route::delete('/articles/{article}', [ArticleController::class, 'destroy']);

        // Video management
        Route::post('/videos', [VideoController::class, 'store']);
        Route::put('/videos/{video}', [VideoController::class, 'update']);
        Route::delete('/videos/{video}', [VideoController::class, 'destroy']);

        // Plan management
        Route::post('/plans', [PlanController::class, 'store']);
        Route::put('/plans/{plan}', [PlanController::class, 'update']);
        Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);
    });
}); 