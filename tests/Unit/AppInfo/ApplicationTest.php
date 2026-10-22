<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\AppInfo;

use OCA\WebAppPassword\AppInfo\Application;
use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\SabrePluginEvent;
use Sabre\DAV\Server;
use Test\TestCase;

class ApplicationTest extends TestCase {
	public function testBootstrapResolvesConfigUsingPublicContainerApi(): void {
		$app = new Application();

		$this->assertInstanceOf(Config::class, $app->getContainer()->get(Config::class));
	}

	public function testAuthenticatedDavListenerResolvesConfigUsingPublicContainerApi(): void {
		$app = new Application();
		$server = $this->createMock(Server::class);
		// Nextcloud's bootstrap may already have registered an application listener.
		$server->expects($this->atLeastOnce())
			->method('addPlugin')
			->with($this->isInstanceOf(CorsPlugin::class));

		$dispatcher = $app->getContainer()->get(IEventDispatcher::class);
		$dispatcher->dispatch('OCA\DAV\Connector\Sabre::addPlugin', new SabrePluginEvent($server));
	}
}
