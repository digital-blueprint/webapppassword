<?php
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Tests\Unit\Controller;

use OCA\WebAppPassword\AppInfo\Application;
use OCA\WebAppPassword\Controller\ShareAPIController;
use OCA\Files_Sharing\Controller\ShareAPIController as FilesSharingShareAPIController;
use OCP\App\IAppManager;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCS\OCSException;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\Constants;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\IRootFolder;
use OCP\Files\Mount\IMountPoint;
use OCP\Files\NotFoundException;
use OCP\Files\Storage;
use OCP\Files\Storage\IStorage;
use OCP\IConfig;
use OCP\IDateTimeZone;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IL10N;
use OCP\IPreview;
use OCP\IRequest;
use OCP\IServerContainer;
use OCP\IURLGenerator;
use OCP\IUser;
use OCP\IUserManager;
use OCP\Lock\LockedException;
use OCP\Share\Exceptions\GenericShareException;
use OCP\Share\IAttributes as IShareAttributes;
use OCP\Share\IManager;
use OCP\Share\IShare;
use OCP\UserStatus\IManager as IUserStatusManager;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Test\TestCase;

/**
 * Class ShareAPIControllerTest
 *
 * @package OCA\Files_Sharing\Tests\Controller
 * @group DB
 */
class ShareAPIControllerTest extends TestCase {
    private string $appName = 'webapppassword';
	private ShareAPIController  $ocs;

	private IRequest|MockObject $request;
	private IL10N|MockObject $l;
	private IConfig|MockObject $config;
	private ContainerInterface|MockObject $serverContainer;

	protected function setUp(): void {

		$this->request = $this->createMock(IRequest::class);
		$this->l = $this->createMock(IL10N::class);
		$this->l->method('t')
			->willReturnCallback(function ($text, $parameters = []) {
				return vsprintf($text, $parameters);
			});
		$this->config = $this->createMock(IConfig::class);
		$this->serverContainer = $this->createMock(ContainerInterface::class);

		$this->filesSharingShareAPIController = $this->createMock(FilesSharingShareAPIController::class);

		/*
			* We collect the reflected constructor parameters from (files
			* sharing share api controller  to be mocked later. As
			* shareapicontroller will need these when dinamically adding
			* parameters to build it from reflected.
			*/
		$this->filesharingParamMocks = [];
		$reflected_sharing = new \ReflectionMethod(FilesSharingShareAPIController::class,'__construct')->getParameters();
		foreach ($reflected_sharing as $param) {
			$param_t = $param->getType()->getName();
			if (!$param->getType()->isBuiltin()) {
				$this->filesharingParamMocks[$param_t] = $this->createMock($param_t);
			}
		}
		/*
			* We tell what needs to be returned when buildconstructorparameters is called
			* in ShareAPIController, it comes from reflected FilesSharingShareAPIController
			* above.
			*/
		$this->serverContainer
		->method('get')
		->willReturnCallback(function ($className) {
			return $this->filesharingParamMocks[$className] ?? null;
		});
		$this->ocs = new ShareAPIController(
			$this->appName,
			$this->request,
			$this->l,
			$this->config,
			$this->serverContainer,
		);
	}

	public function testParentParams() {
		$this->assertEqualsCanonicalizing(get_class_methods(FilesSharingShareAPIController::class), get_class_methods($this->ocs));
	}

	/*
	 * FIXME: WIP testGetGetShare
	private function mockShareAttributes() {
		$formattedShareAttributes = [
			[
				'scope' => 'permissions',
				'key' => 'download',
				'enabled' => true
			]
		];

		$shareAttributes = $this->createMock(IShareAttributes::class);
		$shareAttributes->method('toArray')->willReturn($formattedShareAttributes);
		$shareAttributes->method('getAttribute')->with('permissions', 'download')->willReturn(true);

		// send both IShare attributes class and expected json string
		return [$shareAttributes, \json_encode($formattedShareAttributes)];
	}

	public function createShare($id, $shareType, $sharedWith, $sharedBy, $shareOwner, $path, $permissions,
		$shareTime, $expiration, $parent, $target, $mail_send, $note = '', $token = null,
		$password = null, $label = '', $attributes = null) {
		$share = $this->getMockBuilder(IShare::class)->getMock();
		$share->method('getId')->willReturn($id);
		$share->method('getShareType')->willReturn($shareType);
		$share->method('getSharedWith')->willReturn($sharedWith);
		$share->method('getSharedBy')->willReturn($sharedBy);
		$share->method('getShareOwner')->willReturn($shareOwner);
		$share->method('getNode')->willReturn($path);
		$share->method('getPermissions')->willReturn($permissions);
		$share->method('getNote')->willReturn($note);
		$share->method('getLabel')->willReturn($label);
		$share->method('getAttributes')->willReturn($attributes);
		$time = new \DateTime();
		$time->setTimestamp($shareTime);
		$share->method('getShareTime')->willReturn($time);
		$share->method('getExpirationDate')->willReturn($expiration);
		$share->method('getTarget')->willReturn($target);
		$share->method('getMailSend')->willReturn($mail_send);
		$share->method('getToken')->willReturn($token);
		$share->method('getPassword')->willReturn($password);

		if ($shareType === IShare::TYPE_USER ||
			$shareType === IShare::TYPE_GROUP ||
			$shareType === IShare::TYPE_LINK) {
			$share->method('getFullId')->willReturn('ocinternal:'.$id);
		}

		return $share;
	}

	public function dataGetShare() {
		$data = [];

		$cache = $this->getMockBuilder('OC\Files\Cache\Cache')
			->disableOriginalConstructor()
			->getMock();
		$cache->method('getNumericStorageId')->willReturn(101);

		$storage = $this->getMockBuilder(Storage::class)
			->disableOriginalConstructor()
			->getMock();
		$storage->method('getId')->willReturn('STORAGE');
		$storage->method('getCache')->willReturn($cache);

		$parentFolder = $this->getMockBuilder('OCP\Files\Folder')->getMock();
		$parentFolder->method('getId')->willReturn(3);
		$mountPoint = $this->createMock(IMountPoint::class);
		$mountPoint->method('getMountType')->willReturn('');

		$file = $this->getMockBuilder('OCP\Files\File')->getMock();
		$file->method('getId')->willReturn(1);
		$file->method('getPath')->willReturn('file');
		$file->method('getStorage')->willReturn($storage);
		$file->method('getParent')->willReturn($parentFolder);
		$file->method('getSize')->willReturn(123465);
		$file->method('getMTime')->willReturn(1234567890);
		$file->method('getMimeType')->willReturn('myMimeType');
		$file->method('getMountPoint')->willReturn($mountPoint);

		$folder = $this->getMockBuilder('OCP\Files\Folder')->getMock();
		$folder->method('getId')->willReturn(2);
		$folder->method('getPath')->willReturn('folder');
		$folder->method('getStorage')->willReturn($storage);
		$folder->method('getParent')->willReturn($parentFolder);
		$folder->method('getSize')->willReturn(123465);
		$folder->method('getMTime')->willReturn(1234567890);
		$folder->method('getMimeType')->willReturn('myFolderMimeType');
		$folder->method('getMountPoint')->willReturn($mountPoint);

		[$shareAttributes, $shareAttributesReturnJson] = $this->mockShareAttributes();

		// File shared with user
		$share = $this->createShare(
			100,
			IShare::TYPE_USER,
			'userId',
			'initiatorId',
			'ownerId',
			$file,
			4,
			5,
			null,
			6,
			'target',
			0,
			'personal note',
			$shareAttributes,
		);
		$expected = [
			'id' => 100,
			'share_type' => IShare::TYPE_USER,
			'share_with' => 'userId',
			'share_with_displayname' => 'userDisplay',
			'share_with_displayname_unique' => 'userId@example.com',
			'uid_owner' => 'initiatorId',
			'displayname_owner' => 'initiatorDisplay',
			'item_type' => 'file',
			'item_source' => 1,
			'file_source' => 1,
			'file_target' => 'target',
			'file_parent' => 3,
			'token' => null,
			'expiration' => null,
			'permissions' => 4,
			'attributes' => $shareAttributesReturnJson,
			'stime' => 5,
			'parent' => null,
			'storage_id' => 'STORAGE',
			'path' => 'file',
			'storage' => 101,
			'mail_send' => 0,
			'uid_file_owner' => 'ownerId',
			'note' => 'personal note',
			'label' => '',
			'displayname_file_owner' => 'ownerDisplay',
			'mimetype' => 'myMimeType',
			'has_preview' => false,
			'hide_download' => 0,
			'can_edit' => false,
			'can_delete' => false,
			'item_size' => 123465,
			'item_mtime' => 1234567890,
			'attributes' => null,
			'item_permissions' => 4,
			'is-mount-root' => false,
			'mount-type' => '',
		];
		$data[] = [$share, $expected];

		// Folder shared with group
		$share = $this->createShare(
			101,
			IShare::TYPE_GROUP,
			'groupId',
			'initiatorId',
			'ownerId',
			$folder,
			4,
			5,
			null,
			6,
			'target',
			0,
			'personal note',
			$shareAttributes,
		);
		$expected = [
			'id' => 101,
			'share_type' => IShare::TYPE_GROUP,
			'share_with' => 'groupId',
			'share_with_displayname' => 'groupId',
			'uid_owner' => 'initiatorId',
			'displayname_owner' => 'initiatorDisplay',
			'item_type' => 'folder',
			'item_source' => 2,
			'file_source' => 2,
			'file_target' => 'target',
			'file_parent' => 3,
			'token' => null,
			'expiration' => null,
			'permissions' => 4,
			'attributes' => $shareAttributesReturnJson,
			'stime' => 5,
			'parent' => null,
			'storage_id' => 'STORAGE',
			'path' => 'folder',
			'storage' => 101,
			'mail_send' => 0,
			'uid_file_owner' => 'ownerId',
			'note' => 'personal note',
			'label' => '',
			'displayname_file_owner' => 'ownerDisplay',
			'mimetype' => 'myFolderMimeType',
			'has_preview' => false,
			'hide_download' => 0,
			'can_edit' => false,
			'can_delete' => false,
			'item_size' => 123465,
			'item_mtime' => 1234567890,
			'attributes' => null,
			'item_permissions' => 4,
			'is-mount-root' => false,
			'mount-type' => '',
		];
		$data[] = [$share, $expected];

		// File shared by link with Expire
		$expire = \DateTime::createFromFormat('Y-m-d h:i:s', '2000-01-02 01:02:03');
		$share = $this->createShare(
			101,
			IShare::TYPE_LINK,
			null,
			'initiatorId',
			'ownerId',
			$folder,
			4,
			5,
			$expire,
			6,
			'target',
			0,
			'personal note',
			'token',
			'password',
			'first link share'
		);
		$expected = [
			'id' => 101,
			'share_type' => IShare::TYPE_LINK,
			'password' => 'password',
			'share_with' => 'password',
			'share_with_displayname' => '(Shared link)',
			'send_password_by_talk' => false,
			'uid_owner' => 'initiatorId',
			'displayname_owner' => 'initiatorDisplay',
			'item_type' => 'folder',
			'item_source' => 2,
			'file_source' => 2,
			'file_target' => 'target',
			'file_parent' => 3,
			'token' => 'token',
			'expiration' => '2000-01-02 00:00:00',
			'permissions' => 4,
			'attributes' => null,
			'stime' => 5,
			'parent' => null,
			'storage_id' => 'STORAGE',
			'path' => 'folder',
			'storage' => 101,
			'mail_send' => 0,
			'url' => 'url',
			'uid_file_owner' => 'ownerId',
			'note' => 'personal note',
			'label' => 'first link share',
			'displayname_file_owner' => 'ownerDisplay',
			'mimetype' => 'myFolderMimeType',
			'has_preview' => false,
			'hide_download' => 0,
			'can_edit' => false,
			'can_delete' => false,
			'item_size' => 123465,
			'item_mtime' => 1234567890,
			'attributes' => null,
			'item_permissions' => 4,
			'is-mount-root' => false,
			'mount-type' => '',
		];
		$data[] = [$share, $expected];

		return $data;
	}
	*/

	/**
	 * @dataProvider dataGetShare
	 *
	 * FIXME: WIP testGetShare
	 *
	public function testGetShare(IShare $share, array $result): void {

		// @var ShareAPIController&MockObject $ocs
		$ocs = $this->getMockBuilder(ShareAPIController::class)
				->setConstructorArgs([
					$this->appName,
					$this->request,
					$this->l,
					$this->config,
					$this->serverContainer,
				])//->setMethods(['canAccessShare'])
				->getMock();

		$this->filesharingParamMocks['OCP\Share\IManager']
			->expects($this->any())
			->method('getsharebyid')
			->with($share->getfullid(), 'currentuser')
			->willreturn($share);

		$userFolder = $this->getMockBuilder('OCP\Files\Folder')->getMock();
		$userFolder
			->method('getRelativePath')
			->willReturnArgument(0);

		$userFolder->method('getById')
			->with($share->getNodeId())
			->willReturn([$share->getNode()]);

		$this->filesharingParamMocks['OCP\Files\IRootFolder']->method('getUserFolder')
			->with($this->currentUser)
			->willReturn($userFolder);

		$this->filesharingParamMocks['OCP\IURLGenerator']
			->method('linkToRouteAbsolute')
			->willReturn('url');

		$initiator = $this->getMockBuilder(IUser::class)->getMock();
		$initiator->method('getUID')->willReturn('initiatorId');
		$initiator->method('getDisplayName')->willReturn('initiatorDisplay');

		$owner = $this->getMockBuilder(IUser::class)->getMock();
		$owner->method('getUID')->willReturn('ownerId');
		$owner->method('getDisplayName')->willReturn('ownerDisplay');

		$user = $this->getMockBuilder(IUser::class)->getMock();
		$user->method('getUID')->willReturn('userId');
		$user->method('getDisplayName')->willReturn('userDisplay');
		$user->method('getSystemEMailAddress')->willReturn('userId@example.com');

		$group = $this->getMockBuilder('OCP\IGroup')->getMock();
		$group->method('getGID')->willReturn('groupId');

		$this->filesharingParamMocks['OCP\IUserManager']
		->method('get')->willReturnMap([
			['userId', $user],
			['initiatorId', $initiator],
			['ownerId', $owner],
		]);

		$this->filesharingParamMocks['OCP\IGroupManager']
		->method('get')->willReturnMap([
			['group', $group],
		]);
		$this->filesharingParamMocks['OCP\IDateTimeZone']->method('getTimezone')->willReturn(new \DateTimeZone('UTC'));

		$d = $ocs->getShare($share->getId())->getData()[0];

		$this->assertEquals($result, $ocs->getShare($share->getId())->getData()[0]);
	}
*/



}
