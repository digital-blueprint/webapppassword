<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Settings;

use OCA\WebAppPassword\Config\Config;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\Settings\ISettings;

class Admin implements ISettings {
	/** @var Config */
	private $config;

	/**
	 * Admin constructor.
	 */
	public function __construct(Config $config) {
		$this->config = $config;
	}

	/**
	 * @return TemplateResponse
	 */
	public function getForm() {
		$parameters = [
			'origins' => $this->config->getOrigins(),
			'files_sharing_origins' => $this->config->getFilesSharingOrigins(),
			'preview_origins' => $this->config->getPreviewOrigins(),
			'dav_cors_max_age' => $this->config->getDavCorsMaxAgeOverride(),
			'dav_cors_max_age_from_system' => $this->config->getDavCorsMaxAgeFromSystem(),
			'dav_cors_max_age_limit' => Config::DAV_CORS_MAX_AGE_LIMIT,
		];

		return new TemplateResponse('webapppassword', 'admin', $parameters);
	}

	/**
	 * @return string the section ID, e.g. 'sharing'
	 */
	public function getSection() {
		return 'webapppassword';
	}

	/**
	 * @return int whether the form should be rather on the top or bottom of
	 *             the admin section. The forms are arranged in ascending order of the
	 *             priority values. It is required to return a value between 0 and 100.
	 */
	public function getPriority() {
		return 50;
	}
}
