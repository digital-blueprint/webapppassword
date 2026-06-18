<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Security;

class OriginMatcher {
	/**
	 * @param string[] $allowedOrigins
	 */
	public static function isAllowed(string $origin, array $allowedOrigins): bool {
		$originParts = self::parseOrigin($origin);
		if ($originParts === null) {
			return false;
		}

		foreach ($allowedOrigins as $allowedOrigin) {
			$allowedParts = self::parseOrigin($allowedOrigin);
			if ($allowedParts === null) {
				continue;
			}

			if ($originParts['scheme'] !== $allowedParts['scheme'] || $originParts['port'] !== $allowedParts['port']) {
				continue;
			}

			if (self::hostMatches($originParts['host'], $allowedParts['host'])) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @return array{scheme: string, host: string, port: int|null}|null
	 */
	private static function parseOrigin(string $origin): ?array {
		$parts = parse_url(trim($origin));
		if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
			return null;
		}

		return [
			'scheme' => strtolower($parts['scheme']),
			'host' => strtolower($parts['host']),
			'port' => $parts['port'] ?? null,
		];
	}

	private static function hostMatches(string $originHost, string $allowedHost): bool {
		if (!str_starts_with($allowedHost, '*.')) {
			return $originHost === $allowedHost;
		}

		$suffix = substr($allowedHost, 2);
		$subdomain = substr($originHost, 0, -strlen('.' . $suffix));

		return str_ends_with($originHost, '.' . $suffix)
			&& $subdomain !== ''
			&& !str_contains($subdomain, '.');
	}
}
