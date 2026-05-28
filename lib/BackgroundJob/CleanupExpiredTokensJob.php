<?php

declare(strict_types=1);

namespace OCA\WebAppPassword\BackgroundJob;

use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCA\WebAppPassword\AppInfo\Application;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;
use OCP\IUser;
use OCP\IUserManager;
use Psr\Log\LoggerInterface;

class CleanupExpiredTokensJob extends TimedJob {
	/** @var IProvider */
	private $tokenProvider;

	/** @var IUserManager */
	private $userManager;

	/** @var LoggerInterface */
	private $logger;

	/** @var ITimeFactory */
	private $timeFactory;

	public function __construct(
		ITimeFactory $timeFactory,
		IProvider $tokenProvider,
		IUserManager $userManager,
		LoggerInterface $logger,
	) {
		parent::__construct($timeFactory);

		$this->tokenProvider = $tokenProvider;
		$this->userManager = $userManager;
		$this->logger = $logger;
		$this->timeFactory = $timeFactory;
		$this->setInterval(Application::TOKEN_LIFETIME);
	}

	protected function run($argument) {
		$now = $this->timeFactory->getTime();

		$this->userManager->callForAllUsers(function (IUser $user) use ($now): void {
			$uid = $user->getUID();

			try {
				$tokens = $this->tokenProvider->getTokenByUser($uid);
			} catch (\Throwable $e) {
				$this->logger->warning('Could not load app passwords for user while cleaning WebAppPassword tokens', [
					'app' => Application::APP_NAME,
					'uid' => $uid,
					'exception' => $e,
				]);

				return;
			}

			foreach ($tokens as $token) {
				if (!$this->shouldDeleteToken($token, $now)) {
					continue;
				}

				try {
					$this->tokenProvider->invalidateTokenById($uid, $token->getId());
				} catch (\Throwable $e) {
					$this->logger->warning('Could not delete expired WebAppPassword token', [
						'app' => Application::APP_NAME,
						'uid' => $uid,
						'tokenId' => $token->getId(),
						'exception' => $e,
					]);
				}
			}
		});
	}

	private function shouldDeleteToken(IToken $token, int $now): bool {
		if (strpos($token->getName(), Application::TOKEN_NAME_PREFIX) !== 0) {
			return false;
		}

		$serializedToken = $token->jsonSerialize();
		if (($serializedToken['type'] ?? null) !== IToken::PERMANENT_TOKEN) {
			return false;
		}

		if (!method_exists($token, 'getExpires')) {
			return false;
		}

		$expires = $token->getExpires();

		return $expires !== null && (int)$expires !== 0 && (int)$expires < $now;
	}
}
