<?php declare(strict_types=1);

// Don't return an app password if origin was not allowed
if (!$_['not-allowed']) {
    script('webapppassword', 'script');
}

style('webapppassword', 'style');
?>

<div id="app">
	<div id="app-content">
        <?php p($_['not-allowed'] ? $l->t('This origin is not allowed!') : $l->t('This page should be closed shortly!')); ?>
	</div>
</div>
