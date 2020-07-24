<?php
namespace OCA\WebAppPassword\Controller;

use OCP\IRequest;
use OCP\AppFramework\Controller;
use OCA\WebAppPassword\Config\Config;

/**
 * Class AdminController
 *
 * @package OCA\WebAppPassword\Controller
 */
class AdminController extends Controller
{
    /** @var Config */
    private $config;

    /**
     * AdminController constructor
     *
     * @param string $appName The name of the app
     * @param IRequest $request The request
     * @param Config $config Config for nextcloud
     */
    public function __construct(
        $appName,
        IRequest $request,
        Config $config
    ) {
        parent::__construct($appName, $request);
        $this->config = $config;
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
        $this->config->setOrigins($origins);

        return [
            'origins' => $this->config->getOrigins()
        ];
    }
}