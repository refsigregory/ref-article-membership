<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlansTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('plans')->insert([
            [
                'name' => 'Pro Reader',
                'slug' => 'pro-reader',
                'description' => 'Access all articles and videos',
                'type' => 'PRO_READER',
                'daily_article_limit' => -1, // Unlimited
                'daily_video_limit' => -1, // Unlimited
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Plus Reader',
                'slug' => 'plus-reader',
                'description' => 'Access random 10 articles and videos each day',
                'type' => 'PLUS_READER',
                'daily_article_limit' => 10,
                'daily_video_limit' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Access random 3 articles and videos each day',
                'type' => 'FREE',
                'daily_article_limit' => 3,
                'daily_video_limit' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
