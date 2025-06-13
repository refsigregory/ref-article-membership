<?php
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
        'is_active',
        'slug',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'daily_article_limit' => 'integer',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
} 