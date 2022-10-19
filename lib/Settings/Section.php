<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class Section implements IIconSection
{
    private $l;
    private $url;

    public function __construct(IURLGenerator $url, IL10N $l)
    {
        $this->url = $url;
        $this->l = $l;
    }

    public function getID()
    {
        return 'webapppassword';
    }

    public function getName()
    {
        return $this->l->t('WebAppPassword');
    }

    public function getPriority()
    {
        return 10;
    }

    public function getIcon()
    {
        return $this->url->imagePath('webapppassword', 'app-dark.svg');
    }
}
