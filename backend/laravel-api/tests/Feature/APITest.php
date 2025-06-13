<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class APITest extends TestCase
{
    use RefreshDatabase;

    public function test_api_endpoints_work()
    {
        // Register a new user (include a "role" field so that the CHECK constraint is satisfied)
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'MEMBER' // use allowed value
        ];
        $response = $this->postJson('/api/register', $userData);
        // Dump the response body and status to debug the 500 error
        dump("Register response status: " . $response->status());
        dump("Register response body: " . $response->getContent());
        $response->assertStatus(201);

        // Login (obtain token)
        $loginData = [
            'email' => 'test@example.com',
            'password' => 'password'
        ];
        $response = $this->postJson('/api/login', $loginData);
        $response->assertStatus(200);
        $token = $response->json('token');

        // Call an endpoint (e.g. /api/plans) with the token to prove the API works
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/plans');
        $response->assertStatus(200);
    }
} 