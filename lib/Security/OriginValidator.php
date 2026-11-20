<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Security;

/**
 * Validates and normalizes allowed origin entries before they are stored.
 *
 * The rules are mirrored in js/admin.js, keep both in sync.
 */
class OriginValidator {
	public const ERROR_MISSING_SCHEME = 'missing_scheme';
	public const ERROR_CREDENTIALS = 'credentials';
	public const ERROR_INVALID_HOST = 'invalid_host';
	public const ERROR_INVALID_WILDCARD = 'invalid_wildcard';
	public const ERROR_INVALID_PORT = 'invalid_port';

	/**
	 * Normalizes an origin to "scheme://host[:port]".
	 *
	 * Paths, queries and fragments are dropped, because they are ignored when matching origins.
	 *
	 * @return array{origin: string|null, error: string|null}
	 */
	public static function normalize(string $origin): array {
		if (!preg_match('~^([a-z][a-z0-9+.\-]*)://([^/?#]*)~i', trim($origin), $matches)) {
			return ['origin' => null, 'error' => self::ERROR_MISSING_SCHEME];
		}

		$scheme = strtolower($matches[1]);
		$authority = $matches[2];

		if (str_contains($authority, '@')) {
			return ['origin' => null, 'error' => self::ERROR_CREDENTIALS];
		}

		if (!preg_match('~^(\[[^\]]*\]|[^:]*)(?::(.*))?$~', $authority, $hostMatches)) {
			return ['origin' => null, 'error' => self::ERROR_INVALID_HOST];
		}

		$host = strtolower($hostMatches[1]);
		$port = $hostMatches[2] ?? null;

		if (str_contains($host, '*')) {
			if (!str_starts_with($host, '*.') || str_contains(substr($host, 2), '*')) {
				return ['origin' => null, 'error' => self::ERROR_INVALID_WILDCARD];
			}
			if (!self::isValidHost(substr($host, 2))) {
				return ['origin' => null, 'error' => self::ERROR_INVALID_HOST];
			}
		} elseif (!self::isValidHost($host)) {
			return ['origin' => null, 'error' => self::ERROR_INVALID_HOST];
		}

		if ($port !== null) {
			if (!preg_match('~^\d{1,5}$~', $port) || (int)$port < 1 || (int)$port > 65535) {
				return ['origin' => null, 'error' => self::ERROR_INVALID_PORT];
			}
			$port = (string)(int)$port;
		}

		return [
			'origin' => $scheme . '://' . $host . ($port !== null ? ':' . $port : ''),
			'error' => null,
		];
	}

	/**
	 * Normalizes a comma separated list of origins, dropping empty entries and duplicates.
	 *
	 * @return array{origins: string[], invalid: array<int, array{value: string, error: string}>}
	 */
	public static function normalizeList(string $list): array {
		$origins = [];
		$invalid = [];

		foreach (explode(',', $list) as $entry) {
			$entry = trim($entry);
			if ($entry === '') {
				continue;
			}

			$result = self::normalize($entry);
			if ($result['origin'] === null) {
				$invalid[] = ['value' => $entry, 'error' => (string)$result['error']];
			} elseif (!in_array($result['origin'], $origins, true)) {
				$origins[] = $result['origin'];
			}
		}

		return ['origins' => $origins, 'invalid' => $invalid];
	}

	private static function isValidHost(string $host): bool {
		if (preg_match('~^\[[0-9a-f:.]+\]$~', $host)) {
			return true;
		}

		return (bool)preg_match('~^[a-z0-9_\-]+(\.[a-z0-9_\-]+)*$~', $host);
	}
}
