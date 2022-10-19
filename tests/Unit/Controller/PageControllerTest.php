<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Controller\PageController;
use OCP\AppFramework\Http\TemplateResponse;
use PHPUnit\Framework\TestCase;

class PageControllerTest extends TestCase
{
    private $controller;

    public function setUp(): void
    {
        $userSession = $this->getMockBuilder('OCP\IUserSession')->getMock();
        $request = $this->getMockBuilder('OCP\IRequest')->getMock();
        $session = $this->getMockBuilder('OCP\ISession')->getMock();
        $secureRandom = $this->getMockBuilder('OCP\Security\ISecureRandom')->getMock();
        $provider = $this->getMockBuilder('OC\Authentication\Token\IProvider')->getMock();
        $config = $this->getMockBuilder('OCP\IConfig')->getMock();
        $logger = $this->getMockBuilder('OCA\WebAppPassword\Utility\PsrLogger')->disableOriginalConstructor()->getMock();
        $wapConfig = new Config($config, $logger, []);

        $this->controller = new PageController(
            'webapppassword', $userSession, $request, $session, $secureRandom, $provider, $wapConfig
        );
    }

    public function testIndex()
    {
        $result = $this->controller->index();

        $this->assertEquals('index', $result->getTemplateName());
        $this->assertTrue($result instanceof TemplateResponse);
    }
}
