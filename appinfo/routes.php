<?php

return [
    'routes' => [
	   ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
       ['name' => 'page#create_token', 'url' => '/create', 'verb' => 'POST'],
       ['name' => 'admin#update', 'url' => '/admin', 'verb' => 'PUT'],
    ]
];
