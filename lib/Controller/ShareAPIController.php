<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Controller;

use OCA\Files_Sharing\Controller\ShareAPIController as FilesSharingShareAPIController;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCS\OCSException;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\Files\InvalidPathException;
use OCP\Files\NotFoundException;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IRequest;
use OCP\Lock\LockedException;
use Psr\Container\ContainerInterface;

use ReflectionNamedType;
use ReflectionParameter;

class ShareAPIController extends FilesSharingShareAPIController {
	use AccessControl;

	private $files_sharing_controller;


	public function __construct(
		$AppName,
		IRequest $request,
		private IL10N $l,
		private IConfig $config,
		private ContainerInterface $serverContainer,
		?string $userId = null
	) {
		$this->files_sharing_controller = $this->serverContainer->get(parent::class);


		$parent_constructor_method = new \ReflectionMethod(parent::class, '__construct');
		$parent_constructor_params = $this->buildClassConstructorParameters($parent_constructor_method);
		// set the Appname parameter as it cannot come from reflection (will inject string class)
		$parent_constructor_params[0] = $AppName;
		// reset the userid parameter as it cannot come from reflection (will inject string class too)
		$parent_constructor_params[array_key_last($parent_constructor_params)] = $userId ?? '';
		parent::__construct(...$parent_constructor_params);
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
		// Some NC versions expect $publicUpload to be a string and will throw if it is null.
		// In case of a type error while the variable is null, call the parent function again with
		// $publicUpload set to 'false' instead.
		try {
			$response = parent::createShare(...func_get_args());
		} catch (\TypeError $e) {
			if ($publicUpload == null && str_contains($e->getMessage(), 'Argument #5 ($publicUpload) must be of type string, null given')) {
				$response = parent::createShare($path, $permissions, $shareType, $shareWith, 'false', $password, $sendPasswordByTalk, $expireDate, $note, $label, $attributes, $sendMail);
			}
		}

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
	public function getShare(string $id, bool $include_tags = false): DataResponse {
		//    $this->files_sharing_controller->getShare(...func_get_args());
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
	public function getInheritedShares(string $path): DataResponse {
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
	public function pendingShares(): DataResponse {
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
		// Some NC versions expect $publicUpload to be a string and will throw if it is null.
		// In case of a type error while the variable is null, call the parent function again with
		// $publicUpload set to 'false' instead.
		try {
			$response = parent::updateShare(...func_get_args());
		} catch (\TypeError $e) {
			if ($publicUpload == null && str_contains($e->getMessage(), 'Argument #5 ($publicUpload) must be of type string, null given')) {
				$response = parent::updateShare($id, $permissions, $password, $sendPasswordByTalk, 'false', $expireDate, $note, $label, $hideDownload, $attributes, $sendMail, $token);
			}
		}
		return $this->checkOrigin($response);
	}

	/**
	 * Delete a share.
	 *
	 * @NoAdminRequired
	 *
	 * @throws OCSNotFoundException
	 */
	public function deleteShare(string $id): DataResponse {
		$response = parent::deleteShare(...func_get_args());

		return $this->checkOrigin($response);
	}

	private function buildClassConstructorParameters(\ReflectionMethod $constructor): array {

		$constructor_params = array_map(function (ReflectionParameter $parameter) {

			$parameterType = $parameter->getType();

			$resolveName = $parameter->getName();

			// try to find out if it is a class or a simple parameter
			if ($parameterType !== null && ($parameterType instanceof ReflectionNamedType) && !$parameterType->isBuiltin()) {
				$resolveName = $parameterType->getName();
			}

			try {
				$builtIn = $parameterType !== null && ($parameterType instanceof ReflectionNamedType)
							&& $parameterType->isBuiltin();
				if ($parameterType->isBuiltIn()) {
					if ($parameter->isDefaultValueAvailable()) {
						return $parameter->getDefaultValue();
					}
					return null;
				}
				return $this->serverContainer->get($resolveName);
			} catch (ContainerExceptionInterface $e) {
				// Service not found, use the default value when available
				if ($parameter->isDefaultValueAvailable()) {
					return $parameter->getDefaultValue();
				}

				if ($parameterType !== null && ($parameterType instanceof ReflectionNamedType) && !$parameterType->isBuiltin()) {
					$resolveName = $parameter->getName();
					try {
						return $this->serverContainer->get($resolveName);
					} catch (ContainerExceptionInterface $e2) {
						// Pass null if typed and nullable
						if ($parameter->allowsNull() && ($parameterType instanceof ReflectionNamedType)) {
							return null;
						}
						// don't lose the error we got while trying to query by type
						throw new QueryException($e->getMessage(), (int)$e->getCode(), $e);
					}
				}
				throw $e;
			}
		}, $constructor->getParameters());
		return $constructor_params;
	}
}
