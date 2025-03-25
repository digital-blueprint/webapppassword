<?php

declare(strict_types=1);
$origins = getenv('WEBPASSWORD_ORIGINS');
if ($origins) {
	$CONFIG['webapppassword.origins'] = explode(',', $origins);
}
