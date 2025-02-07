<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Controller;

use OCA\Files_Sharing\Controller\ShareAPIController as FilesSharingShareAPIController;
use OCP\AppFramework\Http\DataResponse;
use OCP\App\IAppManager;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCS\OCSException;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\Files\InvalidPathException;
use OCP\Files\IRootFolder;
use OCP\Files\NotFoundException;
use OCP\IConfig;
use OCP\IDateTimeZone;
use OCP\IGroupManager;
use OCP\IL10N;
use OCP\IPreview;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\Lock\LockedException;
use OCP\Mail\IMailer;
use OCP\Share\IManager;
use OCP\Share\IProviderFactory;
use OCP\UserStatus\IManager as IUserStatusManager;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use OCP\IUserSession;
use OC_Util;
use OCP\IServerContainer;

class ShareAPIController extends FilesSharingShareAPIController
{
	use AccessControl;

	public function __construct(
		$AppName,
		IRequest $request,
		private IManager $shareManager,
		private IGroupManager $groupManager,
		private IUserManager $userManager,
		private IRootFolder $rootFolder,
		private IURLGenerator $urlGenerator,
		private IL10N $l,
		private IConfig $config,
		private IAppManager $appManager,
		private IServerContainer $serverContainerOld,
		private ContainerInterface $serverContainer,
		private IUserStatusManager $userStatusManager,
		private IPreview $previewManager,
		private IDateTimeZone $dateTimeZone,
        private IProviderFactory $factory,
        private IMailer $mailer,
		private LoggerInterface $logger,
		IUserSession $userSession,
	) {
		// In an options request, $user will be null, as there is no Auth header to get data from.
		$user = $userSession->getUser();

		// Enforce $uid to be a string under all circumstances, because Nextcloud's own ShareApiController
		// will break if it is null, even if it is allowed by its constructor. Passing an empty string is fine.
		$uid = $user ? $user->getUID() ?? '' : '';


		// Call the constructor.
		// The parameter order is different between versions, this has to be accounted for.
		// Version string is identical for 27.1.10.1 and 27.1.10.2.
        $intVersion = OC_Util::getVersion();
        if ($intVersion[0] > 29) {
            parent::__construct($AppName, $request, $shareManager, $groupManager, $userManager, $rootFolder, $urlGenerator, $l, $config, $appManager, $serverContainer, $userStatusManager, $previewManager, $dateTimeZone, $logger, $factory, $mailer, $uid);
        }
        else if ($intVersion[0] == 27 and $intVersion[1] == 1 and $intVersion[2] ==  '10') {
			parent::__construct($AppName, $request, $shareManager, $groupManager, $userManager, $rootFolder, $urlGenerator, $uid, $l, $config, $appManager, $serverContainerOld, $userStatusManager, $previewManager, $dateTimeZone);
		} else {
			parent::__construct($AppName, $request, $shareManager, $groupManager, $userManager, $rootFolder, $urlGenerator, $l, $config, $appManager, $serverContainer, $userStatusManager, $previewManager, $dateTimeZone, $logger, $uid);
		}
	}

    /**
     * @NoAdminRequired
     *
     * @param string|null $path
     * @param int|null $permissions
     * @param int $shareType
     * @param string|null $shareWith
     * @param string $publicUpload
     * @param string $password
     * @param string|null $sendPasswordByTalk
     * @param string|null $expireDate
     * @param string $note
     * @param string $label
     * @param string|null $attributes
     * @param string|null $sendMail
     * @return DataResponse
     * @throws NotFoundException
     * @throws OCSBadRequestException
     * @throws OCSForbiddenException
     * @throws OCSNotFoundException
     * @throws OCSException
     * @throws InvalidPathException
     * @suppress PhanUndeclaredClassMethod
     */
	public function createShare(
		?string $path = null,
		?int $permissions = null,
		int $shareType = -1,
		?string $shareWith = null,
        ?string $publicUpload = null,
		string $password = '',
		?string $sendPasswordByTalk = null,
		?string $expireDate = null,
		string $note = '',
		string $label = '',
        ?string $attributes = null,
        ?string $sendMail = null
    ): DataResponse {
		$response = parent::createShare(...func_get_args());

		return $this->checkOrigin($response);
	}


	/**
	 * The getShares function.
	 *
	 * @NoAdminRequired
	 *
	 * @param string $path
	 *
	 * - Get shares by the current user
	 * - Get shares by the current user and reshares (?reshares=true)
	 * - Get shares with the current user (?shared_with_me=true)
	 * - Get shares for a specific path (?path=...)
	 * - Get all shares in a folder (?subfiles=true&path=..)
	 *
	 * @throws NotFoundException
	 * @throws OCSBadRequestException
	 * @throws OCSNotFoundException
	 */
	public function getShares(
		string $shared_with_me = 'false',
		string $reshares = 'false',
		string $subfiles = 'false',
		string $path = '',
		string $include_tags = 'false'
	): DataResponse {
		$response = parent::getShares(...func_get_args());

		return $this->checkOrigin($response);
	}

	/**
	 * Get a specific share by id.
	 *
	 * @NoAdminRequired
	 *
	 * @throws OCSNotFoundException
	 */
	public function getShare(string $id, bool $include_tags = false): DataResponse
	{
		$response = parent::getShare(...func_get_args());

		return $this->checkOrigin($response);
	}

	/**
	 * The getInheritedShares function.
	 * returns all shares relative to a file, including parent folders shares rights.
	 *
	 * @NoAdminRequired
	 *
	 * @param string $path
	 *
	 * - Get shares by the current user
	 * - Get shares by the current user and reshares (?reshares=true)
	 * - Get shares with the current user (?shared_with_me=true)
	 * - Get shares for a specific path (?path=...)
	 * - Get all shares in a folder (?subfiles=true&path=..)
	 *
	 * @throws InvalidPathException
	 * @throws NotFoundException
	 * @throws OCSNotFoundException
	 * @throws OCSBadRequestException
	 * @throws SharingRightsException
	 */
	public function getInheritedShares(string $path): DataResponse
	{
		$response = parent::getInheritedShares(...func_get_args());

		return $this->checkOrigin($response);
	}

	/**
	 * @NoAdminRequired
	 *
	 * @throws InvalidPathException
	 * @throws NotFoundException
	 * @throws OCSNotFoundException
	 * @throws OCSBadRequestException
	 * @throws SharingRightsException
	 */
	public function pendingShares(): DataResponse
	{
		$response = parent::pendingShares(...func_get_args());

		return $this->checkOrigin($response);
	}

    /**
     * @NoAdminRequired
     *
     * @param string $id
     * @param int|null $permissions
     * @param string|null $password
     * @param string|null $sendPasswordByTalk
     * @param string|null $publicUpload
     * @param string|null $expireDate
     * @param string|null $note
     * @param string|null $label
     * @param string|null $hideDownload
     * @param string|null $attributes
     * @param string|null $sendMail
     * @return DataResponse
     * @throws OCSBadRequestException
     * @throws OCSForbiddenException
     * @throws OCSNotFoundException
     * @throws NotFoundException
     * @throws LockedException
     */
	public function updateShare(
		string $id,
		int $permissions = null,
		string $password = null,
		string $sendPasswordByTalk = null,
		?string $publicUpload = null,
		string $expireDate = null,
		string $note = null,
		string $label = null,
		string $hideDownload = null,
        string $attributes = null,
        ?string $sendMail = null,
        ?string $token = null
	): DataResponse {
		$response = parent::updateShare(...func_get_args());

		return $this->checkOrigin($response);
	}

	/**
	 * Delete a share.
	 *
	 * @NoAdminRequired
	 *
	 * @throws OCSNotFoundException
	 */
	public function deleteShare(string $id): DataResponse
	{
		$response = parent::deleteShare(...func_get_args());

		return $this->checkOrigin($response);
	}
}
