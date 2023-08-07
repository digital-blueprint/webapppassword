<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Controller;

use OCA\WebAppPassword\Config\Config;
use OCP\AppFramework\Controller;
use OCP\IRequest;

/**
 * Class AdminController.
 */
class AdminController extends Controller
{
    /** @var Config */
    private $config;

    /**
     * AdminController constructor.
     *
     * @param string   $appName The name of the app
     * @param IRequest $request The request
     * @param Config   $config  Config for nextcloud
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
     * Update the app config.
     *
     * @param string $origins
     *
     * @return array with the updated values
     */
    public function update(
        $origins,
        $files_sharing_origins,
        $preview_origins
    ) {
        $this->config->setOrigins($origins);
        $this->config->setFilesSharingOrigins($files_sharing_origins);
        $this->config->setPreviewOrigins($preview_origins);

        return [
            'origins' => $this->config->getOrigins(),
            'files_sharing_origins' => $this->config->getFilesSharingOrigins(),
            'preview_origins' => $this->config->getPreviewOrigins(),
        ];
    }
}
