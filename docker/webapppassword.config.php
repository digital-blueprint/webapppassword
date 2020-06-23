<?php
$origins = getenv('WEBPASSWORD_ORIGINS');
if ($origins) {
  $CONFIG['webapppassword.origins'] = explode(',', $origins);
}