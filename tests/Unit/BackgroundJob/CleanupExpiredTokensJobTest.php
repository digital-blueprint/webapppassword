<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\Tests\Unit\BackgroundJob;

use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCA\WebAppPassword\AppInfo\Application;
use OCA\WebAppPassword\BackgroundJob\CleanupExpiredTokensJob;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IUser;
use OCP\IUserManager;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class CleanupExpiredTokensJobTest extends TestCase {
	public function testDeletesOnlyExpiredWebAppPasswordTokens(): void {
		$timeFactory = $this->getMockBuilder(ITimeFactory::class)->getMock();
		$timeFactory->method('getTime')->willReturn(2000);

		$user = $this->getMockBuilder(IUser::class)->getMock();
		$user->method('getUID')->willReturn('user1');

		$userManager = $this->getMockBuilder(IUserManager::class)->getMock();
		$userManager->expects($this->once())
			->method('callForAllUsers')
			->willReturnCallback(function (\Closure $callback) use ($user): void {
				$callback($user);
			});

		$expiredToken = $this->createToken(1, Application::TOKEN_NAME_PREFIX . 'https://example.org Agent', IToken::PERMANENT_TOKEN, 1000);
		$activeToken = $this->createToken(2, Application::TOKEN_NAME_PREFIX . 'https://example.org Agent', IToken::PERMANENT_TOKEN, 3000);
		$foreignToken = $this->createToken(3, 'Other app token', IToken::PERMANENT_TOKEN, 1000);

		$tokenProvider = $this->getMockBuilder(IProvider::class)->getMock();
		$tokenProvider->expects($this->once())->method('getTokenByUser')->with('user1')->willReturn([
			$expiredToken,
			$activeToken,
			$foreignToken,
		]);
		$tokenProvider->expects($this->once())->method('invalidateTokenById')->with('user1', 1);

		$logger = $this->getMockBuilder(LoggerInterface::class)->getMock();
		$job = new class($timeFactory, $tokenProvider, $userManager, $logger) extends CleanupExpiredTokensJob {
			public function runNow(): void {
				$this->run(null);
			}
		};

		$job->runNow();
	}

	private function createToken(int $id, string $name, int $type, int $expires) {
		$token = $this->getMockBuilder(IToken::class)
			->addMethods(['getExpires'])
			->getMock();
		$token->method('getId')->willReturn($id);
		$token->method('getName')->willReturn($name);
		$token->method('jsonSerialize')->willReturn(['type' => $type]);
		$token->method('getExpires')->willReturn($expires);

		return $token;
	}
}
