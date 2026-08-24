<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Listener;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use OCA\WebAppPassword\Listener\SabrePluginListener;
use OCP\BeforeSabrePubliclyLoadedEvent;
use PHPUnit\Framework\TestCase;
use Sabre\DAV\Server;

class SabrePluginListenerTest extends TestCase {
	public function testAddsCorsPluginToPublicDavServer(): void {
		$config = $this->createMock(Config::class);
		$config->expects($this->once())
			->method('getOriginList')
			->willReturn(['https://example.com']);

		$server = $this->createMock(Server::class);
		$server->expects($this->once())
			->method('getPlugin')
			->with(CorsPlugin::class)
			->willReturn(null);
		$server->expects($this->once())
			->method('addPlugin')
			->with($this->isInstanceOf(CorsPlugin::class));

		$listener = new SabrePluginListener($config);
		$listener->handle(new BeforeSabrePubliclyLoadedEvent($server));
	}

	public function testDoesNotAddCorsPluginTwice(): void {
		$config = $this->createMock(Config::class);
		$plugin = $this->createMock(CorsPlugin::class);
		$server = $this->createMock(Server::class);
		$server->method('getPlugin')
			->with(CorsPlugin::class)
			->willReturn($plugin);
		$server->expects($this->never())->method('addPlugin');

		$listener = new SabrePluginListener($config);
		$listener->handle(new BeforeSabrePubliclyLoadedEvent($server));
	}
}
