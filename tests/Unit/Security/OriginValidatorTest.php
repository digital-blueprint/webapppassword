<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Security;

use OCA\WebAppPassword\Security\OriginMatcher;
use OCA\WebAppPassword\Security\OriginValidator;
use PHPUnit\Framework\TestCase;

class OriginValidatorTest extends TestCase {
	/**
	 * @dataProvider dataNormalize
	 */
	public function testNormalize(string $input, ?string $expectedOrigin, ?string $expectedError): void {
		$this->assertSame(
			['origin' => $expectedOrigin, 'error' => $expectedError],
			OriginValidator::normalize($input),
		);
	}

	public function dataNormalize(): array {
		return [
			'plain origin' => ['https://example.com', 'https://example.com', null],
			'whitespace is trimmed' => ['  https://example.com ', 'https://example.com', null],
			'scheme and host are lowercased' => ['HTTPS://Example.COM', 'https://example.com', null],
			'port is kept' => ['http://localhost:8081', 'http://localhost:8081', null],
			'leading zeros in port are dropped' => ['http://localhost:08081', 'http://localhost:8081', null],
			'trailing slash is dropped' => ['https://example.com/', 'https://example.com', null],
			'path, query and fragment are dropped' => ['https://example.com/app?a=1#b', 'https://example.com', null],
			'wildcard origin' => ['https://*.example.com', 'https://*.example.com', null],
			'ipv4 origin' => ['http://127.0.0.1:8001', 'http://127.0.0.1:8001', null],
			'ipv6 origin' => ['http://[::1]:8080', 'http://[::1]:8080', null],
			'app scheme' => ['capacitor://localhost', 'capacitor://localhost', null],
			'extension scheme' => ['chrome-extension://abcdefgh', 'chrome-extension://abcdefgh', null],
			'underscore in host' => ['http://my_app:8080', 'http://my_app:8080', null],
			'missing scheme' => ['example.com', null, OriginValidator::ERROR_MISSING_SCHEME],
			'null origin' => ['null', null, OriginValidator::ERROR_MISSING_SCHEME],
			'credentials' => ['https://user:pass@example.com', null, OriginValidator::ERROR_CREDENTIALS],
			'empty host' => ['https://', null, OriginValidator::ERROR_INVALID_HOST],
			'empty label' => ['https://example..com', null, OriginValidator::ERROR_INVALID_HOST],
			'space in host' => ['https://exa mple.com', null, OriginValidator::ERROR_INVALID_HOST],
			'wildcard in the middle' => ['https://app.*.example.com', null, OriginValidator::ERROR_INVALID_WILDCARD],
			'wildcard without dot' => ['https://*example.com', null, OriginValidator::ERROR_INVALID_WILDCARD],
			'double wildcard' => ['https://*.*.example.com', null, OriginValidator::ERROR_INVALID_WILDCARD],
			'bare wildcard' => ['https://*', null, OriginValidator::ERROR_INVALID_WILDCARD],
			'port too large' => ['https://example.com:65536', null, OriginValidator::ERROR_INVALID_PORT],
			'port zero' => ['https://example.com:0', null, OriginValidator::ERROR_INVALID_PORT],
			'empty port' => ['https://example.com:', null, OriginValidator::ERROR_INVALID_PORT],
		];
	}

	public function testNormalizeListKeepsStorageFormat(): void {
		$result = OriginValidator::normalizeList(' https://a.example.com, ,https://*.b.example.com,https://a.example.com/,');

		$this->assertSame(['https://a.example.com', 'https://*.b.example.com'], $result['origins']);
		$this->assertSame([], $result['invalid']);
	}

	public function testNormalizeListReportsInvalidEntries(): void {
		$result = OriginValidator::normalizeList('https://example.com,example.org');

		$this->assertSame(['https://example.com'], $result['origins']);
		$this->assertSame(
			[['value' => 'example.org', 'error' => OriginValidator::ERROR_MISSING_SCHEME]],
			$result['invalid'],
		);
	}

	public function testNormalizedOriginsStillMatch(): void {
		$stored = 'https://example.com/,http://localhost:8081,https://*.example.org';
		$normalized = OriginValidator::normalizeList($stored)['origins'];

		foreach (['https://example.com', 'http://localhost:8081', 'https://app.example.org'] as $origin) {
			$this->assertSame(
				OriginMatcher::isAllowed($origin, explode(',', $stored)),
				OriginMatcher::isAllowed($origin, $normalized),
				$origin,
			);
		}
	}
}
