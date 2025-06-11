<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'intégration avec Supabase
    |
    */

    'url' => env('SUPABASE_URL'),

    'anon_key' => env('SUPABASE_ANON_KEY'),

    'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY'),

    'storage_bucket' => env('SUPABASE_STORAGE_BUCKET', 'pdfs'),

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    */

    'storage' => [
        'bucket' => env('SUPABASE_STORAGE_BUCKET', 'pdfs'),
        'base_url' => env('SUPABASE_URL') . '/storage/v1',
        'public_url' => env('SUPABASE_URL') . '/storage/v1/object/public',
    ],
];
