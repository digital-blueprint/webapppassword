<?php

namespace OCA\WebAppPassword\Controller;

use OCP\AppFramework\Http;
use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\Authentication\Exceptions\CredentialsUnavailableException;
use OCP\Authentication\Exceptions\PasswordUnavailableException;
use OCP\Authentication\LoginCredentials\IStore;
use OCP\ISession;
use OCP\Security\ISecureRandom;
use OCA\WebAppPassword\Config\Config;

class PageController extends Controller
{
    /** @var ISession */
    private $session;

    /** @var ISecureRandom */
    private $random;

    /** @var IProvider */
    private $tokenProvider;

    /** @var IStore */
    private $credentialStore;

    /**
     * @var string[]
     */
    private $origins;

    public function __construct(
        $AppName,
        IRequest $request,
        ISession $session,
        ISecureRandom $random,
        IProvider $tokenProvider,
        IStore $credentialStore,
        Config $config
    ) {
        parent::__construct($AppName, $request);

        $this->session = $session;
        $this->random = $random;
        $this->tokenProvider = $tokenProvider;
        $this->credentialStore = $credentialStore;
        $this->origins = $config->getOriginList();
    }

    /**
     * Checks if the origin is allowed
     *
     * @return bool
     */
    protected function hasAllowedOrigin() :bool {
        $targetOrigin = $this->request->getParam("target-origin");

        foreach ($this->origins as $origin) {
            if (strpos($targetOrigin, $origin) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Shows the page where the script with the postMessage is included
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index()
    {
        $hasAllowedOrigin = $this->hasAllowedOrigin();
        $parameters = [
            'not-allowed' => !$hasAllowedOrigin
        ];

        $response = new TemplateResponse('webapppassword', 'index', $parameters);  // templates/index.php

        if (!$hasAllowedOrigin) {
            $response->setStatus(Http::STATUS_FORBIDDEN);
        }

        // https://help.nextcloud.com/t/solved-nextcloud-16-how-to-allow-iframe-usage/52278/8?u=pbek
        // https://helpcenter.onlyoffice.com/server/integration-edition/third-party-domains.aspx
//        $response->addHeader('Content-Security-Policy', "frame-ancestors 'self' http://127.0.0.1:8001;");
//        $response->addHeader('X-Test', "123123");

        return $response;
    }

    /**
     * Creates a new temporary app password and returns the token
     *
     * @return DataResponse
     * @NoAdminRequired
     * @throws OCSForbiddenException
     */
    public function createToken()
    {
        try {
            $credentials = $this->credentialStore->getLoginCredentials();
        } catch (CredentialsUnavailableException $e) {
            throw new OCSForbiddenException();
        }

        try {
            $password = $credentials->getPassword();
        } catch (PasswordUnavailableException $e) {
            $password = null;
        }

        $loginName = $credentials->getLoginName();
        $name = $this->appName.' '.$this->request->getHeader('USER_AGENT');
        $token = $this->random->generate(
            72,
            ISecureRandom::CHAR_UPPER.ISecureRandom::CHAR_LOWER.ISecureRandom::CHAR_DIGITS
        );

        $this->tokenProvider->generateToken(
            $token,
            $credentials->getUID(),
            $loginName,
            $password,
            $name,
            IToken::TEMPORARY_TOKEN,
            IToken::DO_NOT_REMEMBER
        );

        return new DataResponse(['loginName' => $loginName, 'token' => $token]);
    }
}
