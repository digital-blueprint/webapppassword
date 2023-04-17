<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Controller;

use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSNotFoundException;

trait AccessControl {
  /**
   * Checks the origin of a request and modifies response.
   *
   * @param DataResponse $response
   * @return DataResponse
   * @throws NotFoundException
   * @throws OCSBadRequestException
   * @throws OCSException
   * @throws OCSForbiddenException
   * @throws OCSNotFoundException
   * @throws InvalidPathException
   * @suppress PhanUndeclaredClassMethod
   */
  protected function checkOrigin( DataResponse $response
  ): DataResponse {
    $origins_allowed = $this->getOriginList();
    if (in_array('access-control-allow-origin', $response->getHeaders())) {
      throw new OCSNotFoundException($this->l->t('Could not create share'));
    }

    $origin = $this->request->getHeader('origin');
    if (empty($origin) || !in_array($origin, $origins_allowed, true)) {
      throw new OCSNotFoundException($this->l->t('Could not create share'));
    }

    $response->addHeader('access-control-allow-origin', $origin);
    $response->addHeader('access-control-allow-methods', $this->request->getHeader('access-control-request-method'));
    $response->addHeader('access-control-allow-headers', $this->request->getHeader('access-control-request-headers'));
    $response->addHeader('access-control-expose-headers', 'etag, dav');
    $response->addHeader('access-control-allow-credentials', 'true');
    return $response;
  }

  /**
   * Serializes the allowed origins in a string.
   * 
   * @return string
   *   List allowed origins separated by commas.
   *
   */
  protected function getOrigins(): string
  {
    // TODO DI $this->config->getAppValue('files_sharing_origins', 'origins');
    // __construct must be reimplemented as config prop in parent is private...
    $config = \OC::$server->getConfig();
    $origins = $config->getAppValue('webapppassword', 'files_sharing_origins');
    
    if ($origins === '') {
      $origins = implode(',', $config->getSystemValue('webapppassword.files_sharing.origins', []));
    }

    if ($origins === null) {
      $origins = '';
    }

    return implode(',', array_map('trim', explode(',', $origins)));
  }

  /**
   * Gets an array of the defined allowed origins
   *
   * @return array
   *   List of allowed origins.
   */
  protected function getOriginList()
  {
    return explode(',', $this->getOrigins());
  }
}
