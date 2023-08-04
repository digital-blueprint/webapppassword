<?php

declare(strict_types=1);

return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#create_token', 'url' => '/create', 'verb' => 'POST'],
        ['name' => 'admin#update', 'url' => '/admin', 'verb' => 'PUT'],
		/*
		 * OCS Share API
		 */
		[
			'name' => 'ShareAPI#getShares',
			'url' => '/api/v1/shares',
			'verb' => 'GET',
		],
		[
			'name' => 'ShareAPI#getInheritedShares',
			'url' => '/api/v1/shares/inherited',
			'verb' => 'GET',
		],
		[
			'name' => 'ShareAPI#createShare',
			'url' => '/api/v1/shares',
			'verb' => 'POST',
		],
		[
			'name' => 'ShareAPI#preflighted_cors',
			'url' => '/api/v1/shares',
			'verb' => 'OPTIONS',
		],
		[
			'name' => 'ShareAPI#pendingShares',
			'url' => '/api/v1/shares/pending',
			'verb' => 'GET',
		],
		[
			'name' => 'ShareAPI#getShare',
			'url' => '/api/v1/shares/{id}',
			'verb' => 'GET',
		],
		[
			'name' => 'ShareAPI#updateShare',
			'url' => '/api/v1/shares/{id}',
			'verb' => 'PUT',
		],
		[
			'name' => 'ShareAPI#deleteShare',
			'url' => '/api/v1/shares/{id}',
			'verb' => 'DELETE',
		]
    /*
     * Core preview API
     */
    ['name' => 'Preview#getPreviewByFileId', 'url' => '/core/preview', 'verb' => 'GET'],
    ['name' => 'Preview#preflighted_cors', 'url' => '/core/preview', 'verb' => 'OPTIONS'],
        
    ],
];
