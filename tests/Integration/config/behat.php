<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Webapppassword contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

use Behat\Config\Config;
use Behat\Config\Profile;
use Behat\Config\Suite;

return (new Config())
	->withProfile((new Profile('default', [
		'autoload' => [
			'' => '%paths.base%/../features/bootstrap',
		],
	]))
		->withSuite((new Suite('default'))
			->addContext(
				FeatureContext::class,
				[
					'baseUrl' => 'https://nextcloud.local/index.php',
					'ocsUrl' => 'https://nextcloud.local/ocs/v2.php',
					'publicUrl' => 'https://nextcloud.local/public.php',
					'remoteUrl' => 'https://nextcloud.local/remote.php',
				]
			)
			->withPaths('%paths.base%/../features')))
	->withProfile((new Profile('ci'))
		->withSuite((new Suite('default'))
			->addContext(
				FeatureContext::class,
				[
					'baseUrl' => 'http://localhost:8080/index.php',
					'ocsUrl' => 'http://localhost:8080/ocs/v2.php',
					'publicUrl' => 'http://localhost:8080/public.php',
					'remoteUrl' => 'http://localhost:8080/remote.php',
				]
			)));
