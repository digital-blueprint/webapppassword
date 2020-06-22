<?php
declare(strict_types=1);
/**
 * @copyright Copyright (c) 2020 TU Graz
 *
 * @author Patrizio Bekerle <patrizio@bekerle.com>
 *
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
 *
 */
namespace OCA\WebAppPassword\AppInfo;

use OCA\WebAppPassword\Connector\Sabre\CorsPlugin;
use OCP\AppFramework\App;
use OCP\AppFramework\QueryException;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\SabrePluginEvent;

class Application extends App {
    const APP_NAME = 'webapppassword';

    /**
     * Application constructor
     *
     * @param array $params
     * @throws QueryException
     */
    public function __construct(array $params = []) {
        parent::__construct(self::APP_NAME, $params);

        $container = $this->getContainer();
        $server = $container->getServer();
        /** @var IEventDispatcher $eventDispatcher */
        $eventDispatcher = $server->query(IEventDispatcher::class);

        // Inject CORS headers to allow WebDAV access from inside a webpage
        $eventDispatcher->addListener('OCA\DAV\Connector\Sabre::addPlugin', function(SabrePluginEvent $event) {
            $event->getServer()->addPlugin(new CorsPlugin(\OC::$server->getConfig()));
        });
    }
}
