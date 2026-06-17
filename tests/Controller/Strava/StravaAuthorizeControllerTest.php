<?php

namespace App\Tests\Controller\Strava;

use App\Controller\Strava\StravaAuthorizeController;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;

#[CoversClass(StravaAuthorizeController::class)]
class StravaAuthorizeControllerTest extends TestCase
{
	private function createController(string $clientId, string $redirectUrl): StravaAuthorizeController
	{
		$controller = new StravaAuthorizeController($clientId, $redirectUrl);
		$controller->setContainer(new Container());

		return $controller;
	}

	public function testInvokeReturnsAuthorizationUrlWithExpectedParameters(): void
	{
		$clientId = '12345';
		$redirectUrl = 'https://example.test/strava/callback';

		$controller = $this->createController($clientId, $redirectUrl);
		$response = $controller->__invoke();

		self::assertSame(200, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertArrayHasKey('authorizationUrl', $payload);

		$authorizationUrl = $payload['authorizationUrl'];
		self::assertIsString($authorizationUrl);

		$parts = parse_url($authorizationUrl);
		self::assertIsArray($parts);
		self::assertSame('https', $parts['scheme'] ?? null);
		self::assertSame('www.strava.com', $parts['host'] ?? null);
		self::assertSame('/oauth/authorize', $parts['path'] ?? null);

		$query = [];
		parse_str($parts['query'] ?? '', $query);

		self::assertSame($clientId, $query['client_id'] ?? null);
		self::assertSame('code', $query['response_type'] ?? null);
		self::assertSame($redirectUrl, $query['redirect_uri'] ?? null);
		self::assertSame('force', $query['approval_prompt'] ?? null);
		self::assertSame('read', $query['scope'] ?? null);
	}
}
