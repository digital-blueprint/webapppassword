<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Controller;

use OCA\Files_Sharing\Controller\ShareAPIController as FilesSharingShareAPIController;
use OCP\AppFramework\Http\DataResponse;

class ShareAPIController extends FilesSharingShareAPIController
{
    use AccessControl;

    /**
     * @NoAdminRequired
     *
     * @param string $path
     * @param int    $permissions
     * @param string $shareWith
     * @param string $sendPasswordByTalk
     * @param string $attributes
     *
     * @throws NotFoundException
     * @throws OCSBadRequestException
     * @throws OCSException
     * @throws OCSForbiddenException
     * @throws OCSNotFoundException
     * @throws InvalidPathException
     *
     * @suppress PhanUndeclaredClassMethod
     */
    public function createShare(...$args
    ): DataResponse {
        $response = parent::createShare(...$args);

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
         * @param int    $permissions
         * @param string $password
         * @param string $sendPasswordByTalk
         * @param string $publicUpload
         * @param string $expireDate
         * @param string $note
         * @param string $label
         * @param string $hideDownload
         * @param string $attributes
         *
         * @throws LockedException
         * @throws NotFoundException
         * @throws OCSBadRequestException
         * @throws OCSForbiddenException
         * @throws OCSNotFoundException
         */
      public function updateShare(
          string $id,
          int $permissions = null,
          string $password = null,
          string $sendPasswordByTalk = null,
          string $publicUpload = null,
          string $expireDate = null,
          string $note = null,
          string $label = null,
          string $hideDownload = null,
          string $attributes = null
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
