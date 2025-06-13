<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\HandleCors as Middleware;
use Illuminate\Support\Facades\Log;

class HandleCors extends Middleware
{
    public function handle($request, \Closure $next)
    {
        Log::info('CORS middleware called', [
            'origin' => $request->header('Origin'),
            'method' => $request->method(),
            'path' => $request->path()
        ]);
        
        $response = parent::handle($request, $next);
        
        Log::info('CORS response headers', [
            'headers' => $response->headers->all()
        ]);
        
        return $response;
    }
} 