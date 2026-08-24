<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Listener;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\SabrePluginEvent;

/**
 * @implements IEventListener<SabrePluginEvent>
 */
class SabrePluginListener implements IEventListener {
	public function __construct(
		private Config $config,
	) {
	}

	public function handle(Event $event): void {
		if (!$event instanceof SabrePluginEvent) {
			return;
		}

		$server = $event->getServer();
		if ($server === null || $server->getPlugin(CorsPlugin::class) !== null) {
			return;
		}

		$server->addPlugin(new CorsPlugin($this->config));
	}
}
