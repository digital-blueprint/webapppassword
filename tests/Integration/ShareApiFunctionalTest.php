<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Integration;

use ChristophWurst\Nextcloud\Testing\Selenium;
use ChristophWurst\Nextcloud\Testing\TestCase;
use ChristophWurst\Nextcloud\Testing\TestUser;
use Facebook\WebDriver\WebDriverBy;
use OCP\IUser;

/**
 * Checks if share api is enabled.
 * run with
 * /apps/webapppassword % vendor/bin/phpunit --configuration phpunit.integration.xml tests/Integration/ShareApiFunctionalTest.php
 *
 */
class ShareApiFunctionalTest extends TestCase {
	use TestUser;
	use Selenium;

	/** @var IUser */
	private $user;

	private $container;

	public function setUp(): void {
		parent::setUp();

		$this->user = $this->createTestUser();
	}

	public function testEnableShareApi(): void {

		$this->webDriver->get('http://localhost:8080/index.php/login');
		self::assertStringContainsString('Nextcloud', $this->webDriver->getTitle());

		// Log in
		$this->webDriver->findElement(WebDriverBy::id('user'))->sendKeys($this->user->getUID());
		$this->webDriver->findElement(WebDriverBy::id('password'))->sendKeys('password');
		$this->webDriver->findElement(WebDriverBy::cssSelector('form[name=login] [type=submit]'))->click();
	}
}
