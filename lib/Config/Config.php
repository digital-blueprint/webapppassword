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

    /**
     * Serializes the allowed share api origins in a string.
     * 
     * @return string
     *   List allowed share api origins separated by commas.
     *
     */
    public function getFilesSharingOrigins(): string
    {
        $origins = $this->config->getAppValue('webapppassword', 'files_sharing_origins');
        
        if ($origins === '') {
        $origins = implode(',', $this->config->getSystemValue('webapppassword.files_sharing_origins', []));
        }

        if ($origins === null) {
        $origins = '';
        }

        return implode(',', array_map('trim', explode(',', $origins)));
    }

    /**
     * Gets an array of the defined share api allowed origins
     *
     * @return array
     *   List of allowed share api origins.
     */
    protected function getFilesSharingOriginList()
    {
        return explode(',', $this->getFilesSharingOrigins());
    }

    /**
     * Sets the defined share api allowed origins
     *
     * @param string $value
     *   Comma separated List of allowed share api origins.
     */    
    public function setFilesSharingOrigins($value)
    {
        $this->config->setAppValue('webapppassword', 'files_sharing_origins', $value);
        $this->logger->info('Files Sharing Origins were updated!');
    }    
}
