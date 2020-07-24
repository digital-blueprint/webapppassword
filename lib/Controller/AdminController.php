<?php
namespace OCA\WebAppPassword\Controller;

use OCP\IConfig;
use OCP\IRequest;
use OCP\AppFramework\Controller;
use OCA\WebAppPassword\Utility\PsrLogger;

/**
 * Class AdminController
 *
 * @package OCA\WebAppPassword\Controller
 */
class AdminController extends Controller
{
    /** @var IConfig */
    private $config;

    /** @var PsrLogger */
    private $logger;

    /**
     * AdminController constructor
     *
     * @param string $appName The name of the app
     * @param IRequest $request The request
     * @param IConfig $config Config for nextcloud
     * @param PsrLogger $logger Logger for updated origins
     */
    public function __construct(
        $appName,
        IRequest $request,
        IConfig $config,
        PsrLogger $logger
    ) {
        parent::__construct($appName, $request);
        $this->config = $config;
        $this->logger = $logger;
    }

    /**
     * Update the app config
     *
     * @param string $origins
     *
     * @return array with the updated values
     */
    public function update(
        $origins
    ) {
        $this->config->setAppValue('webapppassword', 'origins', $origins);
        $this->logger->info('Origins were updated!');

        return [
            'origins' => $this->config->getAppValue('webapppassword', 'origins')
        ];
    }
}