<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Config;

use OCP\IConfig;
use Psr\Log\LoggerInterface;

class Config {
	public const DAV_CORS_MAX_AGE_LIMIT = 7200;
	private const DAV_CORS_MAX_AGE_KEY = 'dav_cors_max_age';

	private IConfig $config;

	private LoggerInterface $logger;

	/**
	 * Config constructor.
	 */
	public function __construct(
		IConfig $config,
		LoggerInterface $logger,
	) {
		$this->config = $config;
		$this->logger = $logger;
	}

	public function getOrigins(): string {
		$origins = $this->config->getAppValue('webapppassword', 'origins');

		if ($origins === '') {
			$origins = implode(',', $this->config->getSystemValue('webapppassword.origins', []));
		}

		if ($origins === null) {
			$origins = '';
		}

		return implode(',', array_map('trim', explode(',', $origins)));
	}

	public function getOriginList() {
		return explode(',', $this->getOrigins());
	}

	public function setOrigins($value) {
		$this->config->setAppValue('webapppassword', 'origins', $value);
		$this->logger->info('Origins were updated!');
	}

	public function getDavCorsMaxAge(): ?int {
		return $this->getDavCorsMaxAgeOverride() ?? $this->getDavCorsMaxAgeFromSystem();
	}

	public function getDavCorsMaxAgeOverride(): ?int {
		return self::parseDavCorsMaxAge($this->config->getAppValue('webapppassword', self::DAV_CORS_MAX_AGE_KEY));
	}

	public function getDavCorsMaxAgeFromSystem(): ?int {
		return self::parseDavCorsMaxAge($this->config->getSystemValue('webapppassword.' . self::DAV_CORS_MAX_AGE_KEY, null));
	}

	public function setDavCorsMaxAge(?int $seconds): void {
		if ($seconds === null) {
			$this->config->deleteAppValue('webapppassword', self::DAV_CORS_MAX_AGE_KEY);
		} else {
			$this->config->setAppValue('webapppassword', self::DAV_CORS_MAX_AGE_KEY, (string)$seconds);
		}
	}

	public static function parseDavCorsMaxAge(mixed $value): ?int {
		if (is_string($value) && preg_match('/\A[0-9]+\z/', $value) === 1) {
			$value = (int)$value;
		}

		return is_int($value) && $value >= 0 && $value <= self::DAV_CORS_MAX_AGE_LIMIT ? $value : null;
	}

	/**
	 * Serializes the allowed share api origins in a string.
	 *
	 * @return string
	 *                List allowed share api origins separated by commas
	 */
	public function getFilesSharingOrigins(): string {
		$origins = $this->config->getAppValue('webapppassword', 'files_sharing_origins');

		if ($origins === '') {
			$origins = implode(',', $this->config->getSystemValue('webapppassword.files_sharing_origins', []));
		}

		if ($origins === null) {
			$origins = '';
		}

		return implode(',', array_map('trim', explode(',', $origins)));
	}

	/**
	 * Gets an array of the defined share api allowed origins.
	 *
	 * @return array
	 *               List of allowed share api origins
	 */
	protected function getFilesSharingOriginList() {
		return explode(',', $this->getFilesSharingOrigins());
	}

	/**
	 * Sets the defined share api allowed origins.
	 *
	 * @param string $value
	 *                      Comma separated List of allowed share api origins
	 */
	public function setFilesSharingOrigins($value) {
		$this->config->setAppValue('webapppassword', 'files_sharing_origins', $value);
		$this->logger->info('Files Sharing Origins were updated!');
	}

	/**
	 * Serializes the allowed preview api origins in a string.
	 *
	 * @return string
	 *                List allowed preview api origins separated by commas
	 */
	public function getPreviewOrigins(): string {
		$origins = $this->config->getAppValue('webapppassword', 'preview_origins');

		if ($origins === '') {
			$origins = implode(',', $this->config->getSystemValue('webapppassword.preview_origins', []));
		}

		if ($origins === null) {
			$origins = '';
		}

		return implode(',', array_map('trim', explode(',', $origins)));
	}

	/**
	 * Gets an array of the defined preview api allowed origins.
	 *
	 * @return array
	 *               List of allowed preview api origins
	 */
	protected function getPreviewOriginList() {
		return explode(',', $this->getPreviewOrigins());
	}

	/**
	 * Sets the defined preview api allowed origins.
	 *
	 * @param string $value
	 *                      Comma separated List of allowed preview api origins
	 */
	public function setPreviewOrigins($value) {
		$this->config->setAppValue('webapppassword', 'preview_origins', $value);
		$this->logger->info('Preview origins were updated!');
	}
}
