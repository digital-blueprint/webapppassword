<?php
namespace OCA\WebAppPassword\Controller;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
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
    /** @var IConfig */
    private $config;

    /**
     * AdminController constructor.
     *
     * @param string      $appName     The name of the app
     * @param IRequest    $request     The request
     * @param IConfig     $config      Config for nextcloud
     */
    public function __construct(
        $appName,
        IRequest $request,
        IConfig $config
    ) {
        parent::__construct($appName, $request);
        $this->config      = $config;
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
//            'origins' => $this->config->getOrigins(),
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
//        $this->config->setOrigins($origins);
//        var_dump($origins);
//        var_dump($this->request->getParams());
        $this->config->setAppValue('webapppassword', 'origins', $origins);

        return [
            'origins' => $this->config->getAppValue('webapppassword', 'origins')
        ];
    }
}