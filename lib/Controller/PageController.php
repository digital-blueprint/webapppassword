<?php

namespace OCA\WebAppPassword\Controller;

use OC\Authentication\Exceptions\InvalidTokenException;
use OC\Authentication\Exceptions\PasswordlessTokenException;
use OCP\AppFramework\Http;
use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OC\Authentication\Token\IProvider;
use OC\Authentication\Token\IToken;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\ISession;
use OCP\IUserSession;
use OCP\Security\ISecureRandom;
use OCA\WebAppPassword\Config\Config;
use OCP\Session\Exceptions\SessionNotAvailableException;

class PageController extends Controller
{
    /** @var IUserSession */
    private $userSession;

    /** @var ISession */
    private $session;

    /** @var ISecureRandom */
    private $random;

    /** @var IProvider */
    private $tokenProvider;

    /**
     * @var string[]
     */
    private $origins = [];

    public function __construct(
        $AppName,
        IUserSession $userSession,
        IRequest $request,
        ISession $session,
        ISecureRandom $random,
        IProvider $tokenProvider,
        Config $config
    ) {
        parent::__construct($AppName, $request);

        $this->userSession = $userSession;
        $this->session = $session;
        $this->random = $random;
        $this->tokenProvider = $tokenProvider;
        $this->origins = $config->getOriginList();
    }

    /**
     * Checks if the origin is allowed
     *
     * @return bool
     */
    protected function hasAllowedOrigin() :bool {
        $targetOrigin = $this->request->getParam("target-origin");

        if ($targetOrigin === "") {
            return false;
        }

        foreach ($this->origins as $origin) {
            if ($origin !== "" && strpos($targetOrigin, $origin) === 0) {
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
        // If we are using the $this->credentialStore (OCP\Authentication\LoginCredentials\IStore)
        // we will get empty passwords from our OIDC accounts, this causes \OC\User\Session::checkTokenCredentials
        // to invalidate the token in the first check after 5min, using $this->session solves the problem
        // https://gitlab.tugraz.at/dbp/nextcloud/webapppassword/-/issues/11

//        try {
//            $credentials = $this->credentialStore->getLoginCredentials();
//        } catch (CredentialsUnavailableException $e) {
//            throw new OCSForbiddenException();
//        }
//
//        try {
//            $password = $credentials->getPassword();
//        } catch (PasswordUnavailableException $e) {
//            $password = null;
//        }

        try {
            $sessionId = $this->session->getId();
        } catch (SessionNotAvailableException $ex) {
            throw new OCSForbiddenException();
        }

        try {
            $sessionToken = $this->tokenProvider->getToken($sessionId);
            $loginName = $sessionToken->getLoginName();
            try {
                $password = $this->tokenProvider->getPassword($sessionToken, $sessionId);
            } catch (PasswordlessTokenException $ex) {
                // this will happen for OIDC accounts
                $password = null;
            }
        } catch (InvalidTokenException $ex) {
            throw new OCSForbiddenException();
        }

        $uid = $this->userSession->getUser()->getUID();
//        \OC::$server->getLogger()->warning('uid: ' . var_export($uid, true));
        $targetOrigin = $this->request->getHeader("target-origin");
        $name = $targetOrigin . ' ' . $this->request->getHeader('USER_AGENT');
        $token = $this->random->generate(
            72,
            ISecureRandom::CHAR_UPPER.ISecureRandom::CHAR_LOWER.ISecureRandom::CHAR_DIGITS
        );

        $this->tokenProvider->generateToken(
            $token,
            $uid,
            $loginName,
            $password,
            $name,
            IToken::TEMPORARY_TOKEN,
            IToken::DO_NOT_REMEMBER
        );

        return new DataResponse(
            [
                'loginName' => $loginName,
                'token' => $token,
                'webdavUrl' => \OCP\Util::linkToRemote('dav/files/' . $uid),
            ]
        );
    }
}
