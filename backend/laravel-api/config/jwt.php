<?php

return [
    /*
    |--------------------------------------------------------------------------
    | JWT Secret Key
    |--------------------------------------------------------------------------
    |
    | This key is used to sign and verify JWT tokens. Make sure to keep it
    | secret and use a strong key in production.
    |
    */
    'secret' => env('JWT_SECRET', 'your-secret-key'),

    /*
    |--------------------------------------------------------------------------
    | JWT Token Expiry
    |--------------------------------------------------------------------------
    |
    | The number of seconds until a JWT token expires. Default is 1 hour.
    |
    */
    'expiry' => env('JWT_EXPIRY', 3600),

    /*
    |--------------------------------------------------------------------------
    | JWT Refresh Token Expiry
    |--------------------------------------------------------------------------
    |
    | The number of seconds a refresh token is valid for.
    |
    */
    'refresh_expiry' => env('JWT_REFRESH_EXPIRY', 604800), // 1 week
]; 