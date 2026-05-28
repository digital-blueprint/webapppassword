<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCA\WebAppPassword\AppInfo\Application;
use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Controller\PageController;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IConfig;
use OCP\IRequest;
use OCP\ISession;
use OCP\IUser;
use OCP\IUserSession;
use OCP\Security\ISecureRandom;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class PageControllerTest extends TestCase {
	private $controller;
	private $userSession;
	private $request;
	private $session;
	private $secureRandom;
	private $provider;
	private $timeFactory;

	public function setUp(): void {
		$this->userSession = $this->getMockBuilder(IUserSession::class)->getMock();
		$this->request = $this->getMockBuilder(IRequest::class)->getMock();
		$this->session = $this->getMockBuilder(ISession::class)->getMock();
		$this->secureRandom = $this->getMockBuilder(ISecureRandom::class)->getMock();
		$this->provider = $this->getMockBuilder(IProvider::class)->getMock();
		$this->timeFactory = $this->getMockBuilder(ITimeFactory::class)->getMock();
		$config = $this->getMockBuilder(IConfig::class)->getMock();
		$config->method('getAppValue')->willReturn('');
		$config->method('getSystemValue')->willReturn([]);
		$logger = $this->getMockBuilder(LoggerInterface::class)->getMock();
		$wapConfig = new Config($config, $logger);

		$this->controller = new PageController(
			'webapppassword',
			$this->userSession,
			$this->request,
			$this->session,
			$this->secureRandom,
			$this->provider,
			$this->timeFactory,
			$wapConfig
		);
	}

	public function testIndex() {
		$result = $this->controller->index();

		$this->assertEquals('index', $result->getTemplateName());
		$this->assertTrue($result instanceof TemplateResponse);
	}

	public function testCreateTokenCreatesExpiringPermanentToken() {
		$user = $this->getMockBuilder(IUser::class)->getMock();
		$user->method('getUID')->willReturn('user1');
		$this->userSession->method('getUser')->willReturn($user);

		$this->session->method('getId')->willReturn('session-token');

		$sessionToken = $this->getMockBuilder(IToken::class)->getMock();
		$sessionToken->method('getLoginName')->willReturn('login-name');
		$this->provider->method('getToken')->with('session-token')->willReturn($sessionToken);
		$this->provider->method('getPassword')->with($sessionToken, 'session-token')->willReturn('password');

		$this->request->method('getHeader')->willReturnMap([
			['target-origin', 'https://example.org'],
			['USER_AGENT', 'TestAgent'],
		]);
		$this->secureRandom->method('generate')->willReturn('generated-token');
		$this->timeFactory->method('getTime')->willReturn(1000);

		$generatedToken = $this->getMockBuilder(IToken::class)->getMock();
		$generatedToken->expects($this->once())
			->method('setExpires')
			->with(1000 + Application::TOKEN_LIFETIME);

		$this->provider->expects($this->once())
			->method('generateToken')
			->with(
				'generated-token',
				'user1',
				'login-name',
				'password',
				Application::TOKEN_NAME_PREFIX . 'https://example.org TestAgent',
				IToken::PERMANENT_TOKEN,
				IToken::DO_NOT_REMEMBER
			)
			->willReturn($generatedToken);
		$this->provider->expects($this->once())->method('updateToken')->with($generatedToken);

		$result = $this->controller->createToken();

		$this->assertTrue($result instanceof DataResponse);
		$this->assertSame('generated-token', $result->getData()['token']);
	}
}
