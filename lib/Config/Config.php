<?php
namespace OCA\WebAppPassword\Config;

use OCA\WebAppPassword\Utility\PsrLogger;
use OCP\IConfig;

class Config
{
    /** @var IConfig */
    private $config;

    /** @var PsrLogger */
    private $logger;

    private $loggerParams;

    /**
     * Config constructor
     *
     * @param IConfig $config
     * @param PsrLogger $logger
     * @param $LoggerParameters
     */
    public function __construct(
        IConfig $config,
        PsrLogger $logger,
        $LoggerParameters
    ) {
        $this->config = $config;
        $this->logger = $logger;
        $this->loggerParams = $LoggerParameters;
    }

    public function getOrigins()
    {
        $origins = $this->config->getAppValue('webapppassword', 'origins');

        if ($origins === '') {
            $origins = implode(',', $this->config->getSystemValue('webapppassword.origins', []));
        }

        return $origins;
    }

    public function getOriginList()
    {
        return explode(',', $this->getOrigins());
    }

    public function setOrigins($value)
    {
        $this->config->setAppValue('webapppassword', 'origins', $value);
        $this->logger->info('Origins were updated!');
    }
}
