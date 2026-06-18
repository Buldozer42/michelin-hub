<?php

namespace App\Tests\Support;

final class StravaServiceCurlState
{
    public static bool $shouldFailInit = false;
    public static ?string $execResult = null;
    public static int $statusCode = 200;
    public static string $error = '';
    public static ?string $lastUrl = null;
    public static array $lastOptions = [];

    public static function reset(): void
    {
        self::$shouldFailInit = false;
        self::$execResult = null;
        self::$statusCode = 200;
        self::$error = '';
        self::$lastUrl = null;
        self::$lastOptions = [];
    }
}