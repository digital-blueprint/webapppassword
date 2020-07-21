<?php

return [
    'routes' => [
	    ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#create_token', 'url' => '/create', 'verb' => 'POST'],
        ['name' => 'admin#index', 'url' => '/admin', 'verb' => 'GET'],
        ['name' => 'admin#update', 'url' => '/admin', 'verb' => 'PUT'],
    ]
];
