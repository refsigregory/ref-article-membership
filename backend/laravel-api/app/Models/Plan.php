<?php
/**
 * @OA\Schema(
 *     schema="Plan",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Pro Reader"),
 *     @OA\Property(property="description", type="string", example="Access to all premium content"),
 *     @OA\Property(property="type", type="string", enum={"PRO_READER", "PLUS_READER", "FREE"}, example="PRO_READER"),
 *     @OA\Property(property="price", type="number", format="float", example=9.99),
 *     @OA\Property(property="daily_article_limit", type="integer", example=10),
 *     @OA\Property(property="daily_video_limit", type="integer", example=5),
 *     @OA\Property(property="features", type="array", @OA\Items(type="string"), example=["Feature 1", "Feature 2"]),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'type',
        'price',
        'daily_article_limit',
        'daily_video_limit',
        'features',
        'is_active',
        'slug',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'daily_article_limit' => 'integer',
        'daily_video_limit' => 'integer',
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    protected $attributes = [
        'is_active' => true,
        'daily_article_limit' => 0,
        'daily_video_limit' => 0,
        'price' => 0,
        'features' => '[]',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->features)) {
                $plan->features = [];
            }
        });

        static::updating(function ($plan) {
            if (empty($plan->features)) {
                $plan->features = [];
            }
        });
    }

    // Always return an array for features, never null
    public function getFeaturesAttribute($value)
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return $decoded === null ? [] : $decoded;
        }
        return [];
    }
} 