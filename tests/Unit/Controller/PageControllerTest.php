<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCA\WebAppPassword\AppInfo\Application;
use OCA\WebAppPassword\Config\Config;
use OCA\WebAppPassword\Controller\PageController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IConfig;
use OCP\IRequest;
use OCP\ISession;
use OCP\IUser;
use OCP\IUserSession;
use OCP\Security\ISecureRandom;
use PHPUnit\Framework\Attributes\DataProvider;
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
		$this->assertSame(Http::STATUS_FORBIDDEN, $result->getStatus());
	}

	/**
	 * @dataProvider acceptedExpectedUids
	 */
	#[DataProvider('acceptedExpectedUids')]
	public function testCreateTokenCreatesExpiringPermanentToken(?string $expectedUid): void {
		$user = $this->getMockBuilder(IUser::class)->getMock();
		$user->method('getUID')->willReturn('user1');
		$this->userSession->method('getUser')->willReturn($user);
		$this->request->method('getParam')->with('expected-uid')->willReturn($expectedUid);

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
		$this->assertSame(Http::STATUS_OK, $result->getStatus());
		$data = $result->getData();
		$this->assertSame('generated-token', $data['token']);
		$this->assertSame('login-name', $data['loginName']);
		if ($expectedUid !== null) {
			$this->assertSame('user1', $data['uid']);
		} else {
			$this->assertArrayNotHasKey('uid', $data);
		}
	}

	public static function acceptedExpectedUids(): array {
		return [
			'legacy caller' => [null],
			'matching UID, different login name' => ['user1'],
		];
	}

	/**
	 * @dataProvider rejectedExpectedUids
	 */
	#[DataProvider('rejectedExpectedUids')]
	public function testCreateTokenRejectsUnexpectedAccountWithoutIssuingToken(mixed $expectedUid, int $status, string $error): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn('user1');
		$this->userSession->method('getUser')->willReturn($user);
		$this->request->method('getParam')->with('expected-uid')->willReturn($expectedUid);
		$this->provider->expects($this->never())->method('getToken');
		$this->secureRandom->expects($this->never())->method('generate');
		$this->provider->expects($this->never())->method('generateToken');
		$this->provider->expects($this->never())->method('updateToken');

		$response = $this->controller->createToken();

		$this->assertSame($status, $response->getStatus());
		$this->assertSame(['error' => $error], $response->getData());
	}

	public static function rejectedExpectedUids(): array {
		return [
			'different account' => ['user2', Http::STATUS_CONFLICT, 'account_mismatch'],
			'login name instead of UID' => ['login-name', Http::STATUS_CONFLICT, 'account_mismatch'],
			'case mismatch' => ['User1', Http::STATUS_CONFLICT, 'account_mismatch'],
			'empty account' => ['', Http::STATUS_BAD_REQUEST, 'invalid_expected_uid'],
			'array instead of UID' => [['user1'], Http::STATUS_BAD_REQUEST, 'invalid_expected_uid'],
		];
	}
}
