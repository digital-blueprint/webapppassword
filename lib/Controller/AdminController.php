<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Controller;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Security\OriginValidator;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IL10N;
use OCP\IRequest;

/**
 * Class AdminController.
 */
class AdminController extends Controller {
	/** @var Config */
	private $config;

	private IL10N $l10n;

	/**
	 * AdminController constructor.
	 *
	 * @param string $appName The name of the app
	 * @param IRequest $request The request
	 * @param Config $config Config for nextcloud
	 */
	public function __construct(
		$appName,
		IRequest $request,
		Config $config,
		IL10N $l10n,
	) {
		parent::__construct($appName, $request);
		$this->config = $config;
		$this->l10n = $l10n;
	}

	/**
	 * Update the app config.
	 *
	 * Origins are stored as comma separated lists. Nothing is stored if any value is invalid.
	 *
	 * @param string $origins
	 * @param string $files_sharing_origins
	 * @param string $preview_origins
	 * @param mixed $dav_cors_max_age Omit to leave unchanged; send an empty string to clear the override
	 *
	 * @return DataResponse with the updated values or the invalid entries
	 */
	public function update(
		$origins,
		$files_sharing_origins,
		$preview_origins,
		mixed $dav_cors_max_age = null,
	): DataResponse {
		$maxAge = Config::parseDavCorsMaxAge($dav_cors_max_age);
		if ($dav_cors_max_age !== null && $dav_cors_max_age !== '' && $maxAge === null) {
			return new DataResponse([
				'message' => $this->l10n->t('Enter a whole number from 0 to %s seconds or leave the DAV preflight cache duration blank. Nothing was saved.', [Config::DAV_CORS_MAX_AGE_LIMIT]),
			], Http::STATUS_BAD_REQUEST);
		}

		$fields = [
			'origins' => (string)$origins,
			'files_sharing_origins' => (string)$files_sharing_origins,
			'preview_origins' => (string)$preview_origins,
		];

		$normalized = [];
		$invalid = [];
		foreach ($fields as $key => $value) {
			$result = OriginValidator::normalizeList($value);
			$normalized[$key] = implode(',', $result['origins']);

			foreach ($result['invalid'] as $entry) {
				$invalid[$key][] = [
					'value' => $entry['value'],
					'message' => $this->getErrorMessage($entry['error']),
				];
			}
		}

		if ($invalid !== []) {
			return new DataResponse([
				'message' => $this->l10n->t('Some origins are invalid. Nothing was saved.'),
				'invalid' => $invalid,
			], Http::STATUS_BAD_REQUEST);
		}

		$this->config->setOrigins($normalized['origins']);
		$this->config->setFilesSharingOrigins($normalized['files_sharing_origins']);
		$this->config->setPreviewOrigins($normalized['preview_origins']);
		if ($dav_cors_max_age !== null) {
			$this->config->setDavCorsMaxAge($maxAge);
		}

		$data = [
			'origins' => $this->config->getOrigins(),
			'files_sharing_origins' => $this->config->getFilesSharingOrigins(),
			'preview_origins' => $this->config->getPreviewOrigins(),
		];
		if ($dav_cors_max_age !== null) {
			$data['dav_cors_max_age'] = $this->config->getDavCorsMaxAgeOverride();
		}

		return new DataResponse($data);
	}

	private function getErrorMessage(string $error): string {
		return match ($error) {
			OriginValidator::ERROR_MISSING_SCHEME => $this->l10n->t('Add a scheme, e.g. https://example.com'),
			OriginValidator::ERROR_CREDENTIALS => $this->l10n->t('Usernames and passwords are not allowed'),
			OriginValidator::ERROR_INVALID_WILDCARD => $this->l10n->t('Only a leading wildcard like https://*.example.com is supported'),
			OriginValidator::ERROR_INVALID_PORT => $this->l10n->t('The port must be a number between 1 and 65535'),
			default => $this->l10n->t('The host name is invalid'),
		};
	}
}
