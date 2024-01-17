<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\WebAppPassword\Controller;

use OC\Core\Controller\PreviewController as CorePreviewController;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Response;

class PreviewController extends CorePreviewController
{
    use AccessControl;

    private $corsMethods = 'PUT, POST, GET, DELETE, PATCH';
    private $corsAllowedHeaders = 'Authorization, Content-Type, Accept';
    private $corsMaxAge = 1728000;

    /**
     * @NoAdminRequired
     *
     * @NoCSRFRequired
     *
     * Get a preview by file ID
     *
     * @param int    $fileId    ID of the file
     * @param int    $x         Width of the preview
     * @param int    $y         Height of the preview
     * @param bool   $a         Whether to not crop the preview
     * @param bool   $forceIcon Force returning an icon
     * @param string $mode      How to crop the image
     *
     * @return FileDisplayResponse<Http::STATUS_OK, array{Content-Type: string}>|DataResponse<Http::STATUS_BAD_REQUEST|Http::STATUS_FORBIDDEN|Http::STATUS_NOT_FOUND, array<empty>, array{}>
     *
     * 200: Preview returned
     * 400: Getting preview is not possible
     * 403: Getting preview is not allowed
     * 404: Preview not found
     */
    public function getPreviewByFileId(
        int $fileId = -1,
        int $x = 32,
        int $y = 32,
        bool $a = false,
        bool $forceIcon = true,
        string $mode = 'fill',
        bool $mimeFallback = false)
    {
        $response = parent::getPreviewByFileId(...func_get_args());

        return $this->checkPreviewOrigin($response);
    }

    /**
     * This method implements a preflighted cors response for you that you can
     * link to for the options request.
     *
     * @NoAdminRequired
     *
     * @NoCSRFRequired
     *
     * @PublicPage
     */
    public function preflightedCors()
    {
        // Disallow by default
        // "null" is not advised to be used as an origin
        $origin = $this->request->server['HTTP_ORIGIN'] ?? '';

        $response = new Response();
        $response->addHeader('Access-Control-Allow-Origin', $origin);
        $response->addHeader('Access-Control-Allow-Methods', $this->corsMethods);
        $response->addHeader('Access-Control-Max-Age', (string) $this->corsMaxAge);
        $response->addHeader('Access-Control-Allow-Headers', $this->corsAllowedHeaders);
        $response->addHeader('Access-Control-Allow-Credentials', 'false');

        return $response;
    }
}
