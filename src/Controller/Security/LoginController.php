<?php
namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Entity\User;

class LoginController extends AbstractController
{
    public function __construct(
    ){}

    public function __invoke(
        EntityManagerInterface $manager,
        JWTTokenManagerInterface $jwtManager,
        Request $request,
        UserPasswordHasherInterface $hasher,    
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $login = $data['login'] ?? null;
        $password = $data['password'] ?? null;

        if (!$login || !$password) {
            return new JsonResponse(['error' => 'Login and password are required'], 400);
        }

        $user = $manager->getRepository(User::class)->findOneBy(['email' => $login]) ?? null;
        if (!$user) {
            $user = $manager->getRepository(User::class)->findOneBy(['username' => $login]) ?? null;
        }

        if (!$user || !$hasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['error' => 'Invalid credentials'], 401);
        }

        $token = $jwtManager->create($user);

        return new JsonResponse(
            [
                'token' => $token,
                'roles' => $user->getRoles(),
                'userId' => $user->getId(),
            ]
        );
    }
}