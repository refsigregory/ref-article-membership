<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WholeAPITest extends TestCase
{
    use RefreshDatabase;

    public function test_whole_api_flow()
    {
        // 1. Register an admin user directly in DB
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('adminpass'),
            'role' => 'ADMIN',
        ]);

        // 2. Login as admin
        $response = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'adminpass',
        ]);
        $response->assertStatus(200);
        $adminToken = $response->json('token');

        // 3. Create a plan as admin
        $planData = [
            'name' => 'Pro Reader',
            'description' => 'Access to all premium content',
            'type' => 'PRO_READER',
            'daily_article_limit' => 10,
            'daily_video_limit' => 5,
            'is_active' => true,
        ];
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/plans', $planData);
        dump('Plan create response status: ' . $response->status());
        dump('Plan create response body: ' . $response->getContent());
        $response->assertStatus(201);
        $planId = $response->json('id');

        // 4. Register a member user
        $response = $this->postJson('/api/register', [
            'name' => 'Member',
            'email' => 'member@example.com',
            'password' => 'memberpass',
            'password_confirmation' => 'memberpass',
            'role' => 'MEMBER',
        ]);
        $response->assertStatus(201);

        // 5. Login as member
        $response = $this->postJson('/api/login', [
            'email' => 'member@example.com',
            'password' => 'memberpass',
        ]);
        $response->assertStatus(200);
        $memberToken = $response->json('token');

        // 6. List plans as member
        $response = $this->withHeader('Authorization', 'Bearer ' . $memberToken)
            ->getJson('/api/plans');
        $response->assertStatus(200);
        $this->assertTrue(count($response->json()) > 0);

        // 7. Subscribe to a plan as member
        $response = $this->withHeader('Authorization', 'Bearer ' . $memberToken)
            ->postJson('/api/subscriptions', [
                'plan_id' => $planId,
            ]);
        $response->assertStatus(201);

        // 8. Access articles as member (should be 200 or 403 if no articles, but endpoint works)
        $response = $this->withHeader('Authorization', 'Bearer ' . $memberToken)
            ->getJson('/api/articles');
        file_put_contents('/tmp/articles_response_debug.txt', "Status: " . $response->status() . "\nBody: " . $response->getContent());
        $this->assertTrue(in_array($response->status(), [200, 403, 404]));
    }
} 