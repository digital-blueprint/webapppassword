<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use Behat\Step\Then;
use Behat\Step\When;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\ServerException;

use PHPUnit\Framework\Assert;
use Psr\Http\Message\ResponseInterface;

/**
 * Defines application features from the specific context.
 */
class FeatureContext implements Context {
	private array $clientOptions;
	private ?ResponseInterface $response = null;
	private ?array $json = null;
	private ?string $currentUser = null;
	private ?string $nextcloudVersion = null;
	private ?string $origin = null;
	private ?string $lastShareId = null;
	private array $cookieJars = [];
	private array $requestTokens = [];
	private array $store = [];
	private bool $setXdebugSession = true;
	private string $xdebugSession = "local_ide";

	private const SHARE_API_URL = '/apps/webapppassword/api/v1/';

	/**
	 * Initializes context.
	 * Every scenario gets its own context instance.
	 * You can also pass arbitrary arguments to the
	 * context constructor through behat.yml.
	 */
	public function __construct(
		private string $baseUrl,
		private string $ocsUrl,
		public string $publicUrl,
		private string $remoteUrl,
	) {
		$this->clientOptions = ['verify' => false];
	}

	/**
	 * @throws GuzzleException
	 */
	#[Then('user :user sees shares related to path :path')]
	public function userSeesShare(string $user, string $path): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares/inherited?path=' . $path);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(100);
		$this->assertResponseData();
	}

	/**
	 * @throws GuzzleException
	 */
	#[Then('user :user can not see shares related to path :path')]
	public function userCannotSeeShare(string $user, string $path): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares/inherited?path=' . $path);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(400);
		$this->assertResponseData();
	}

	/**
	 * @throws GuzzleException
	 */
	#[Then('user :user sees recently shared item')]
	public function userSeesRecentlyShared(string $user): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares/' . $this->lastShareId);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(100);
		$this->assertResponseData();
	}

	/**
	 * User cannot see recently shared item
	 *
	 * @throws GuzzleException
	 */
	#[Then('user :user cannot see recently shared item')]
	public function userCannotSeeRecentlyShared(string $user): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares/' . $this->lastShareId);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(400);
		$this->assertResponseData();
	}

	/**
	 * User sees shares
	 *
	 * @throws GuzzleException
	 */
	#[Then('user :user sees shares')]
	public function userSeesShares(string $user): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares');
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(100);
		$this->assertResponseData();
	}

	/**
	 * User cannot see shares
	 *
	 * @throws GuzzleException
	 */
	#[Then('user :user cannot see shares')]
	public function userCannotSeeShares(string $user): void {
		$this->setCurrentUser($user);
		$this->sendShareApiWebAppRequest('GET', 'shares');
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(400);
		$this->assertResponseData();
	}

	#[When('user comes from :origin')]
	public function userComesFromOrigin(string $origin): void {
		$this->setOrigin($origin);
	}

	#[Then('user :user can not create share :share')]
	public function userCannotCreateShare($user, $share): void {
		$this->setCurrentUser($user);
		$formData = new TableNode([
			["path", $share],
			["shareType", "3"],
			["label", "welcome txt shared"],
			["password", 'undefined']
		]);
		$this->sendShareApiWebAppRequest('POST', 'shares', $formData);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(400);
		$this->assertResponseData();
		//$this->sendOcsCollectivesRequest('POST', 'share', $formData);
	}

	#[Then('user :user creates share :share')]
	public function userCreatesShare($user, $share): void {
		$this->setCurrentUser($user);
		$formData = new TableNode([
			["path", $share],
			["shareType", "3"],
			["label", "welcome txt shared"],
			["password", 'undefined']
		]);
		$this->sendShareApiWebAppRequest('POST', 'shares', $formData);
		$this->assertStatusCode(200);
		$this->assertOCSStatusCode(100);
		$this->assertResponseData();
		$this->lastShareId = $this->getJson()['ocs']['data']['id'];
		//$this->sendOcsCollectivesRequest('POST', 'share', $formData);
	}

	#[Then('Not logged user cannot see shares')]
	public function notLoggedUserCannotSeeShares(): void {
		$this->setCurrentUser("unknown");
		$this->sendShareApiWebAppRequest('GET', 'shares');
		$this->assertStatusCode([401,500]);
	}


	private function setCurrentUser(string $user): void {
		$this->currentUser = $user;
	}

	private function setOrigin(string $origin): void {
		$this->origin = $origin;
	}

	/**
	 * @throws GuzzleException
	 */
	private function sendShareApiWebAppRequest(string $verb,
		string $url,
		?TableNode $body = null,
		?array $jsonBody = null,
		array $headers = [],
		?bool $auth = true): void {
		$this->sendWebAppOcsRequest($verb, self::SHARE_API_URL . $url, $body, $jsonBody, $headers, $auth);
	}

	/**
	 * @throws GuzzleException
	 */
	private function sendWebAppOcsRequest(string $verb,
		string $url,
		?TableNode $body = null,
		?array $jsonBody = null,
		array $headers = [],
		?bool $auth = true): void {
		$fullUrl = $this->baseUrl . $url;

		// Add Xdebug trigger variable as GET parameter
		$ocsJsonFormat = 'format=json';
		if (str_contains($fullUrl, '?')) {
			$fullUrl .= '&' . $ocsJsonFormat;
		} else {
			$fullUrl .= '?' . $ocsJsonFormat;
		}

		if ($this->origin) {
			$headers['origin'] = $this->origin;
		}
		$this->sendRequestBase($verb, $fullUrl, $body, $jsonBody, $headers, $auth);
	}

	/**
	 * @throws GuzzleException
	 */
	private function sendOcsRequest(string $verb,
		string $url,
		?TableNode $body = null,
		?array $jsonBody = null,
		array $headers = [],
		?bool $auth = true): void {
		$fullUrl = $this->ocsUrl . $url;

		// Add Xdebug trigger variable as GET parameter
		$ocsJsonFormat = 'format=json';
		if (str_contains($fullUrl, '?')) {
			$fullUrl .= '&' . $ocsJsonFormat;
		} else {
			$fullUrl .= '?' . $ocsJsonFormat;
		}
		$this->sendRequestBase($verb, $fullUrl, $body, $jsonBody, $headers, $auth);
	}



	private function sendPublicRequest(string $verb,
		string $url,
		$body = null,
		?array $jsonBody = null,
		array $headers = []) {
		$fullUrl = $this->publicUrl . $url;
		$this->sendRequestBase($verb, $fullUrl, $body, $jsonBody, $headers, false);
	}

	/**
	 * @param TableNode|string|null $body
	 *
	 * @throws GuzzleException
	 */
	private function sendRequestBase(string $verb,
		string $url,
		$body = null,
		?array $jsonBody = null,
		array $headers = [],
		?bool $auth = true): void {
		$client = new Client($this->clientOptions);

		if ($auth === true && !isset($this->cookieJars[$this->currentUser])) {
			$this->cookieJars[$this->currentUser] = new CookieJar();
		}

		// Get request token for user (required due to CSRF checks)
		if ($auth === true && !isset($this->requestTokens[$this->currentUser])) {
			$this->getUserRequestToken($this->currentUser);
		}

		$options = ['cookies' => $this->cookieJars[$this->currentUser]];

		$options['headers'] = array_merge($headers, [
			'requesttoken' => $this->requestTokens[$this->currentUser],
		]);

		if ($body instanceof TableNode) {
			$fd = $body->getRowsHash();
			$options['form_params'] = $fd;
		} elseif (is_string($body)) {
			$options['body'] = $body;
		}

		if ($jsonBody) {
			$options['json'] = $jsonBody;
		}

		// Add Xdebug trigger variable as GET parameter
		if ($this->setXdebugSession) {
			$xdebugSession = 'XDEBUG_SESSION=' . $this->xdebugSession;
			if (str_contains($url, '?')) {
				$url .= '&' . $xdebugSession;
			} else {
				$url .= '?' . $xdebugSession;
			}
		}

		// clear the cached json response
		$this->json = null;
		try {
			if ($verb === 'PROPFIND' || $verb === 'MOVE') {
				$this->response = $client->request($verb, $url, $options);
			} else {
				$this->response = $client->{$verb}($url, $options);
			}
		} catch (ClientException $e) {
			$this->response = $e->getResponse();
		} catch (ServerException $e) {
			$this->response = $e->getResponse();
		}
	}

	/**
	 * @throws GuzzleException
	 */
	private function getUserRequestToken(string $user): void {
		$loginUrl = $this->baseUrl . '/login';

		if (!isset($this->requestTokens[$user])) {
			// Request a new session and extract CSRF token
			$client = new Client($this->clientOptions);
			$response = $client->get(
				$loginUrl,
				[
					'cookies' => $this->cookieJars[$user],
					'headers' => [
						'Origin' => $this->baseUrl,
					],
				],
			);
			$requestToken = substr(preg_replace('/(.*)data-requesttoken="(.*)">(.*)/sm', '\2', $response->getBody()->getContents()), 0, 89);

			// Login and extract new token
			$client = new Client($this->clientOptions);
			$this->response = $client->post(
				$loginUrl,
				[
					'form_params' => [
						'user' => $user,
						'password' => $user,
						'requesttoken' => $requestToken,
					],
					'cookies' => $this->cookieJars[$user],
					'headers' => [
						'Origin' => $this->baseUrl,
					],
				]
			);
			$this->assertStatusCode(200);

			$this->requestTokens[$user] = substr(preg_replace('/(.*)data-requesttoken="(.*)">(.*)/sm', '\2', $this->response->getBody()->getContents()), 0, 89);
		}
	}

	/**
	 * @throws JsonException
	 */
	private function getJson(): array {
		if (!$this->json) {
			$this->json = json_decode($this->response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
		}
		return $this->json;
	}

	private function assertStatusCode(mixed $statusCode, string $message = ''): void {
		if (is_int($statusCode)) {
			$message = $message ?: 'Status code ' . $this->response->getStatusCode() . ' is not expected ' . $statusCode . '.';
			Assert::assertEquals($statusCode, $this->response->getStatusCode(), $message);
		} elseif (is_array($statusCode)) {
			$message = $message ?: 'Status code ' . $this->response->getStatusCode() . ' is neither of ' . implode(', ', $statusCode) . '.';
			Assert::assertContains($this->response->getStatusCode(), $statusCode, $message);
		}
	}

	private function assertOCSStatusCode(mixed $statusCode, string $message = ''): void {
		$jsonBody = $this->getJson();
		if (is_int($statusCode)) {
			$message = $message ?: 'OCS Meta Status code ' . $jsonBody['ocs']['meta']['statuscode'] . ' is not expected ' . $statusCode . '.';
			Assert::assertEquals($statusCode, $jsonBody['ocs']['meta']['statuscode'], $message);
		} elseif (is_array($statusCode)) {
			$message = $message ?: 'Status code ' . $jsonBody['ocs']['meta']['statuscode'] . ' is neither of ' . implode(', ', $statusCode) . '.';
			Assert::assertContains($jsonBody['ocs']['meta']['statuscode'], $statusCode, $message);
		}
	}


	private function assertResponseData(?bool $revert = false): void {
		$jsonBody = $this->getJson();
		Assert::assertIsArray($jsonBody['ocs']['data']);
	}

}
