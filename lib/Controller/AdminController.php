<?php
namespace OCA\WebAppPassword\Controller;

use OCP\AppFramework\Http\TemplateResponse;
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
    private $config;
    private $configPath;

    /**
     * AdminController constructor.
     *
     * @param string      $appName     The name of the app
     * @param IRequest    $request     The request
     * @param Config      $config      Config for nextcloud
     * @param string      $configFile  Path to the config
     */
    public function __construct(
        $appName,
        IRequest $request,
        Config $config,
        $configFile
    ) {
        parent::__construct($appName, $request);
        $this->config      = $config;
        $this->configPath  = $configFile;
    }

    /**
     * Controller main entry.
     *
     * There are no checks for the index method since the output is
     * rendered in admin/admin.php
     *
     * @return TemplateResponse
     */
    public function index()
    {
        $data = [
            'origins' => $this->config->getOrigins(),
        ];
        return new TemplateResponse($this->appName, 'admin', $data, 'blank');
    }

    /**
     * Update the app config.
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
            'origins' => $this->config->getOrigins(),
        ];
    }
}