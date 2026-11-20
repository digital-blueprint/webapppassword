<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Connector\Sabre;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use Sabre\HTTP\Request;
use Sabre\HTTP\Response;

class CorsPluginTest extends TestCase {
	/**
	 * @dataProvider requests
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider('requests')]
	#[RunInSeparateProcess]
	#[PreserveGlobalState(false)]
	public function testDavPreflightCacheHeader(?int $duration, string $method, array $headers, array $existing, ?string $expected, int $status): void {
		$config = $this->createMock(Config::class);
		$config->method('getOriginList')->willReturn(['https://example.com']);
		$config->method('getDavCorsMaxAge')->willReturn($duration);
		$request = new Request($method, '/public.php/webdav/', $headers);
		$response = new Response(200, $existing);

		(new CorsPlugin($config))->setCorsHeaders($request, $response);

		$this->assertSame($expected, $response->getHeader('Access-Control-Max-Age'));
		$this->assertSame($status, $response->getStatus());
	}

	public static function requests(): array {
		$origin = ['Origin' => 'https://example.com'];
		$preflight = $origin + ['Access-Control-Request-Method' => 'PROPFIND'];
		return [
			'unset' => [null, 'OPTIONS', $preflight, [], null, 204],
			'enabled' => [300, 'OPTIONS', $preflight, [], '300', 204],
			'disabled' => [0, 'OPTIONS', $preflight, [], '0', 204],
			'ordinary OPTIONS' => [300, 'OPTIONS', $origin, [], null, 204],
			'authenticated OPTIONS' => [300, 'OPTIONS', $preflight + ['Authorization' => 'Basic example'], [], null, 200],
			'actual request' => [300, 'PROPFIND', $origin, [], null, 200],
			'disallowed origin' => [300, 'OPTIONS', ['Origin' => 'https://elsewhere.example'] + $preflight, [], null, 200],
			'existing max-age' => [300, 'OPTIONS', $preflight, ['Access-Control-Max-Age' => '60'], '60', 204],
			'existing CORS policy' => [300, 'OPTIONS', $preflight, ['Access-Control-Allow-Origin' => 'https://example.com'], null, 200],
		];
	}
}
