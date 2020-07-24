<?php
script('webapppassword', 'admin');
style('webapppassword', 'admin');
?>

<div class="section" id="webapppassword">
    <h2>Web App Password</h2>
    <div class="form-line">
        <p>
            <label for="webapppassword-origins">
                <?php p($l->t('Allowed origins')); ?>
            </label>
        <p>
            <em><?php p($l->t('Origins that are allowed to access the page')); ?></em>
        </p>
        <p>
            <input type="text"
                  id="webapppassword-origins"
                  name="webapppassword-origins"
                  placeholder="https://example.com,https://example2.com"
                  value="<?php p($_['origins']); ?>">
            <button class="button" id="webapppassword-store-origins"><?php p($l->t('Set origins')); ?></button>
            <span id="webapppassword-saved-message" class="msg success"><?php p($l->t('Saved')); ?></span>
        </p>
    </div>
</div>
