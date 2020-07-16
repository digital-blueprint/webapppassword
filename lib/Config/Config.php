<?php
namespace OCA\WebAppPassword\Config;
use OCA\WebAppPassword\Utility\PsrLogger;
use OCP\Files\Folder;

class Config
{
    private $fileSystem;
    private $logger;
    private $loggerParams;
    private $origins;

    public function __construct(
        Folder $fileSystem,
        PsrLogger $logger,
        $LoggerParameters
    ) {
        $this->fileSystem = $fileSystem;
        $this->logger = $logger;
        $this->loggerParams = $LoggerParameters;
        $this->origins = [];
    }

    public function getOrigins()
    {
        return $this->origins;
    }

    public function setOrigins($value)
    {
        $this->origins = $value;
    }

    public function read($configPath, $createIfNotExists = false)
    {
        if ($createIfNotExists && !$this->fileSystem->nodeExists($configPath)) {
            $this->fileSystem->newFile($configPath);
            $this->write($configPath);
        } else {
            $content = $this->fileSystem->get($configPath)->getContent();
            $configValues = parse_ini_string($content);

            if ($configValues === false || count($configValues) === 0) {
                $this->logger->warning(
                    'Configuration invalid. Ignoring values.',
                    $this->loggerParams
                );
            } else {
                foreach ($configValues as $key => $value) {
                    if (property_exists($this, $key)) {
                        $type = gettype($this->$key);
                        settype($value, $type);
                        $this->$key = $value;
                    } else {
                        $this->logger->warning(
                            'Configuration value "' . $key .
                            '" does not exist. Ignored value.',
                            $this->loggerParams
                        );
                    }
                }
            }
        }
    }

    public function write($configPath)
    {
        $ini =
            'origins = ' .
            var_export($this->origins, true);
        ;

        $this->fileSystem->get($configPath)->putContent($ini);
    }
}
