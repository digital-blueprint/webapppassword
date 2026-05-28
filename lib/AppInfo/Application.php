<?php

declare(strict_types=1);
/**
 * @copyright Copyright (c) 2020 TU Graz
 * @author Patrizio Bekerle <patrizio@bekerle.com>
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

namespace OCA\WebAppPassword\AppInfo;

use OCA\WebAppPassword\BackgroundJob\CleanupExpiredTokensJob;
use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\QueryException;
use OCP\BackgroundJob\IJobList;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\IConfig;
use OCP\IContainer;
use OCP\SabrePluginEvent;
use Psr\Log\LoggerInterface;

class Application extends App implements IBootstrap {
	public const APP_NAME = 'webapppassword';
	public const TOKEN_NAME_PREFIX = 'WebAppPassword: ';
	public const TOKEN_LIFETIME = 86400;
	private const CLEANUP_JOB_INTERVAL_CONFIG_KEY = 'cleanup_job_interval';

	/**
	 * Application constructor.
	 *
	 * @throws QueryException
	 */
	public function __construct(array $params = []) {
		parent::__construct(self::APP_NAME, $params);

		$container = $this->getContainer();
		$server = $container->getServer();

		// Register config service
		$container->registerService(Config::class, function (IContainer $c): Config {
			return new Config(
				$c->query(IConfig::class),
				$c->query(LoggerInterface::class)
			);
		});

		/** @var IEventDispatcher $eventDispatcher */
		$eventDispatcher = $server->query(IEventDispatcher::class);

		// Inject CORS headers to allow WebDAV access from inside a webpage
		$eventDispatcher->addListener(
			'OCA\DAV\Connector\Sabre::addPlugin',
			function (SabrePluginEvent $event) use ($container) {
				$event->getServer()->addPlugin(new CorsPlugin($container->query(Config::class)));
			}
		);
	}

	public function register(IRegistrationContext $context): void {
	}

	public function boot(IBootContext $context): void {
		$context->injectFn(function (IJobList $jobList, IConfig $config): void {
			$currentInterval = (string)self::TOKEN_LIFETIME;
			$registeredInterval = $config->getAppValue(self::APP_NAME, self::CLEANUP_JOB_INTERVAL_CONFIG_KEY, '');
			$hasJob = $jobList->has(CleanupExpiredTokensJob::class, null);

			if (!$hasJob || $registeredInterval !== $currentInterval) {
				if ($hasJob) {
					$jobList->remove(CleanupExpiredTokensJob::class, null);
				}

				$jobList->add(CleanupExpiredTokensJob::class, null);
				$config->setAppValue(self::APP_NAME, self::CLEANUP_JOB_INTERVAL_CONFIG_KEY, $currentInterval);
			}
		});
	}
}
