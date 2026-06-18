<?php

namespace App\Controller\Strava;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class StravaAuthorizeController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(STRAVA_CLIENT_ID)%')]
        private readonly string $stravaClientId,
        #[Autowire('%env(STRAVA_AUTH_REDIRECT_URL)%')]
        private readonly string $stravaRedirectUrl,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $scope = (string) $request->query->get('scope', 'read');
        $authorizationUrl = sprintf(
            'https://www.strava.com/oauth/authorize?%s',
            http_build_query([
                'client_id' => $this->stravaClientId,
                'response_type' => 'code',
                'redirect_uri' => $this->stravaRedirectUrl,
                'approval_prompt' => 'force',
                'scope' => $scope,
            ])
        );

        return $this->json([
            'authorizationUrl' => $authorizationUrl,
        ]);
    }
}