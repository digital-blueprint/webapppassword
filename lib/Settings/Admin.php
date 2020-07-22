<?php
namespace OCA\WebAppPassword\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;
//use OCA\WebAppPassword\Config\Config;

class Admin implements ISettings {
    /** @var IConfig */
    private $config;

    /**
     * Admin constructor.
     *
     * @param IConfig $config
     */
    public function __construct(IConfig $config) {
        $this->config = $config;
    }

    /**
     * @return TemplateResponse
     */
    public function getForm() {
        $parameters = [
            'origins' => $this->config->getAppValue('webapppassword', 'origins'),
        ];

        return new TemplateResponse('webapppassword', 'admin', $parameters);
    }

    /**
     * @return string the section ID, e.g. 'sharing'
     */
    public function getSection() {
        return 'webapppassword';
    }

    /**
     * @return int whether the form should be rather on the top or bottom of
     * the admin section. The forms are arranged in ascending order of the
     * priority values. It is required to return a value between 0 and 100.
     */
    public function getPriority() {
        return 50;
    }

}
