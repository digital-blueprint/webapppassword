<?php

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OCA\WebAppPassword\Config\Config;
use PHPUnit\Framework\TestCase;
use OCP\AppFramework\Http\TemplateResponse;
use OCA\WebAppPassword\Controller\PageController;


class PageControllerTest extends TestCase {
	private $controller;

	public function setUp():void {
		$request = $this->getMockBuilder('OCP\IRequest')->getMock();
		$session = $this->getMockBuilder('OCP\ISession')->getMock();
		$secureRandom = $this->getMockBuilder('OCP\Security\ISecureRandom')->getMock();
		$store = $this->getMockBuilder('OCP\Authentication\LoginCredentials\IStore')->getMock();
		$provider = $this->getMockBuilder('OC\Authentication\Token\IProvider')->getMock();
		$config = $this->getMockBuilder('OCP\IConfig')->getMock();
		$logger = $this->getMockBuilder('OCA\WebAppPassword\Utility\PsrLogger')->disableOriginalConstructor()->getMock();
		$wapConfig = new Config($config, $logger, []);

		$this->controller = new PageController(
			'webapppassword', $request, $session, $secureRandom, $provider, $store, $wapConfig
		);
	}

	public function testIndex() {
		$result = $this->controller->index();

		$this->assertEquals('index', $result->getTemplateName());
		$this->assertTrue($result instanceof TemplateResponse);
	}

}
