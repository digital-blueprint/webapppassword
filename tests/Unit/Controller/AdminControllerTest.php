<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Controller\AdminController;
use OCP\AppFramework\Http;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IRequest;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class AdminControllerTest extends TestCase {
	/**
	 * @dataProvider durations
	 */
	#[DataProvider('durations')]
	public function testUpdatingSettings(mixed $submitted, string $stored, mixed $system, ?int $override, ?int $effective, int $status, ?string $write): void {
		$settings = ['dav_cors_max_age' => $stored];
		$storage = $this->createMock(IConfig::class);
		$storage->method('getAppValue')->willReturnCallback(
			static function ($app, $key, $default = '') use (&$settings) {
				return $settings[$key] ?? $default;
			},
		);
		$storage->method('getSystemValue')->willReturnCallback(
			static fn ($key, $default = '') => $key === 'webapppassword.dav_cors_max_age' ? $system : $default,
		);
		$writes = [];
		$storage->method('setAppValue')->willReturnCallback(
			static function ($app, $key, $value) use (&$settings, &$writes): void {
				$settings[$key] = $value;
				$writes[] = $key;
			},
		);
		$storage->method('deleteAppValue')->willReturnCallback(
			static function ($app, $key) use (&$settings, &$writes): void {
				unset($settings[$key]);
				$writes[] = 'delete:' . $key;
			},
		);
		$config = new Config($storage, new NullLogger());
		$controller = new AdminController('webapppassword', $this->createMock(IRequest::class), $config, $this->createMock(IL10N::class));

		$result = $submitted === null
			? $controller->update('https://example.com', '', '')
			: $controller->update('https://example.com', '', '', $submitted);

		$expectedWrites = $status === Http::STATUS_OK ? ['origins', 'files_sharing_origins', 'preview_origins'] : [];
		if ($write !== null) {
			$expectedWrites[] = $write;
		}
		$this->assertSame($status, $result->getStatus());
		$this->assertSame($expectedWrites, $writes);
		$this->assertSame($override, $config->getDavCorsMaxAgeOverride());
		$this->assertSame($effective, $config->getDavCorsMaxAge());
		if ($status === Http::STATUS_OK) {
			if ($submitted === null) {
				$this->assertArrayNotHasKey('dav_cors_max_age', $result->getData());
			} else {
				$this->assertSame($override, $result->getData()['dav_cors_max_age']);
			}
		}
	}

	public static function durations(): array {
		return [
			'old payload leaves unset settings unset' => [null, '', null, null, null, 200, null],
			'unchanged UI leaves fallback in effect' => [null, '', 300, null, 300, 200, null],
			'old payload preserves an override' => [null, '300', 600, 300, 300, 200, null],
			'opt-in' => [300, '', null, 300, 300, 200, 'dav_cors_max_age'],
			'explicit zero overrides system' => [0, '', 300, 0, 0, 200, 'dav_cors_max_age'],
			'clear override to restore system' => ['', '0', 300, null, 300, 200, 'delete:dav_cors_max_age'],
			'clear override to restore browser default' => ['', '300', null, null, null, 200, 'delete:dav_cors_max_age'],
			'invalid system value does not enable caching' => [null, '', true, null, null, 200, null],
			'negative' => [-1, '', null, null, null, 400, null],
			'over limit' => [7201, '', null, null, null, 400, null],
			'fraction' => [1.5, '', null, null, null, 400, null],
			'array' => [[300], '', null, null, null, 400, null],
		];
	}
}
