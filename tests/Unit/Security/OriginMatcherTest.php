<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Security;

use OCA\WebAppPassword\Security\OriginMatcher;
use PHPUnit\Framework\TestCase;

class OriginMatcherTest extends TestCase {
	/**
	 * @dataProvider dataIsAllowed
	 *
	 * @param string[] $allowedOrigins
	 */
	public function testIsAllowed(string $origin, array $allowedOrigins, bool $expected): void {
		$this->assertSame($expected, OriginMatcher::isAllowed($origin, $allowedOrigins));
	}

	public function dataIsAllowed(): array {
		return [
			'exact origin matches' => [
				'https://example.com',
				['https://example.com'],
				true,
			],
			'exact localhost origin with port matches' => [
				'http://localhost:8001',
				['http://localhost:8001'],
				true,
			],
			'exact loopback ip origin with port matches' => [
				'http://127.0.0.1:8001',
				['http://127.0.0.1:8001'],
				true,
			],
			'localhost and loopback ip are distinct origins' => [
				'http://127.0.0.1:8001',
				['http://localhost:8001'],
				false,
			],
			'exact origin allows path in input url' => [
				'https://example.com/path',
				['https://example.com'],
				true,
			],
			'exact origin rejects malicious suffix' => [
				'https://example.com.evil.org',
				['https://example.com'],
				false,
			],
			'wildcard matches one subdomain level' => [
				'https://app.example.com',
				['https://*.example.com'],
				true,
			],
			'wildcard rejects apex domain' => [
				'https://example.com',
				['https://*.example.com'],
				false,
			],
			'wildcard rejects deeper subdomain' => [
				'https://a.b.example.com',
				['https://*.example.com'],
				false,
			],
			'wildcard rejects malicious suffix' => [
				'https://app.example.com.evil.org',
				['https://*.example.com'],
				false,
			],
			'wildcard requires matching scheme' => [
				'http://app.example.com',
				['https://*.example.com'],
				false,
			],
			'wildcard requires matching port' => [
				'https://app.example.com:8443',
				['https://*.example.com:8443'],
				true,
			],
			'wildcard rejects different port' => [
				'https://app.example.com:9443',
				['https://*.example.com:8443'],
				false,
			],
			'plain wildcard is not supported' => [
				'https://example.com',
				['*'],
				false,
			],
		];
	}
}
