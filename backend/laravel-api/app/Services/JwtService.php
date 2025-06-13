<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class JwtService
{
    protected $key;
    protected $algorithm;
    protected $expiry;

    public function __construct()
    {
        $this->key = config('jwt.secret');
        $this->algorithm = 'HS256';
        $this->expiry = 60 * 60; // 1 hour
    }

    public function generateToken(User $user): string
    {
        $payload = [
            'iss' => config('app.url'),
            'iat' => time(),
            'exp' => time() + $this->expiry,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ];

        return JWT::encode($payload, $this->key, $this->algorithm);
    }

    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->key, $this->algorithm));
            return (array) $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function refreshToken(string $token): ?string
    {
        $payload = $this->validateToken($token);
        if (!$payload) {
            return null;
        }

        $user = User::find($payload['user']['id']);
        if (!$user) {
            return null;
        }

        return $this->generateToken($user);
    }
} 