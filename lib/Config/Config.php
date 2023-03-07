<?php

declare(strict_types=1);

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
     * Config constructor.
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

    public function getOrigins(): string
    {
        $origins = $this->config->getAppValue('webapppassword', 'origins');

        if ($origins === '') {
            $origins = implode(',', $this->config->getSystemValue('webapppassword.origins', []));
        }

        if ($origins === null) {
            $origins = '';
        }

        return implode(',', array_map('trim', explode(',', $origins)));
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

    public function getAllowCustomName(): bool
    {
        return $this->config->getAppValue('webapppassword', 'allowCustomName') == 'true';
    }

    public function setAllowCustomName($value)
    {
        $this->config->getAppValue('webapppassword', 'allowCustomName', $value);
        $this->logger->info('Origins were updated!');
    }
}
