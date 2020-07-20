<?php
script('webapppassword', 'admin');
style('webapppassword', 'admin');
?>

<div class="section" id="webapppassword">
    <h2>Web App Password</h2>
    <div class="form-line">
        <p>
            <label for="webapppassword-origins">
            <?php p($l->t('Allowed origins')); ?></p>
        </label>
        <p>
            <em>
                <?php p($l->t(
                    'Origins that are allowed to access the page'
                )); ?></em>
        </p>
        <p><input type="text" name="webapppassword-origins"
                  value="<?php p($_['origins']); ?>"></p>
    </div>
    <div id="webapppassword-saved-message">
        <span class="msg success"><?php p($l->t('Saved')); ?></span>
    </div>
</div>
