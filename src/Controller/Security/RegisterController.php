<?php
namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Entity\User;

class RegisterController extends AbstractController
{
    public function __invoke(
        EntityManagerInterface $manager,
        Request $request,
        UserPasswordHasherInterface $hasher,    
    ): JsonResponse
    {
        // Récupère et valide les données de la requête
        $data = json_decode($request->getContent(), true);

        // Valide les champs requis et leur format
        $lastName = trim((string) ($data['lastName'] ?? ''));
        $firstName = trim((string) ($data['firstName'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $username = trim((string) ($data['username'] ?? ''));
        if (
            $lastName === '' ||
            $firstName === '' ||
            $email === '' ||
            $username === '' ||
            $password === ''
        ) {
            return $this->json(['error' => 'Tous les champs sont obligatoires'], 400);
        }

        // Valide la force du mot de passe
        if (!$this->isStrongPassword($password)) {
            return $this->json([
                'error' => 'Le mot de passe doit contenir 14 caracteres minimum, une majuscule, une minuscule, un chiffre et un caractere special',
            ], 400);
        }

        // Valide le format de l'email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Adresse email invalide'], 400);
        }

        // Vérifie que le username et l'email ne sont pas déjà utilisés
        if (
            $manager->getRepository(User::class)->findOneBy(['username' => $username]) ||
            $manager->getRepository(User::class)->findOneBy(['email' => $email])
        ) {
            return $this->json(['error' => 'Ce compte est deja utilise'], 409);
        }

        // Crée l'utilisateur
        $user = (new User())
            ->setUsername($username)
            ->setEmail($email)
            ->setPassword($password)
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->hashUserPassword($hasher)
            ->setRoles(['ROLE_USER']);
        ;

        $manager->persist($user);
        $manager->flush();

        // Retourne une réponse de succès avec les IDs du client et de l'utilisateur
        return $this->json([
            'message' => 'Inscription reussie',
            'userId' => $user->getId(),
        ], 201);
    }

    /**
     * Vérifie si un mot de passe est suffisamment fort selon les critères suivants :
     * - Au moins 14 caractères
     * - Contient au moins une lettre majuscule
     * - Contient au moins une lettre minuscule
     * - Contient au moins un chiffre
     * - Contient au moins un caractère spécial
     *
     * @param string $password Le mot de passe à vérifier
     * @return bool true si le mot de passe est fort, false sinon
     */
    private function isStrongPassword(string $password): bool
    {
        // Vérifie que le mot de passe comporte au moins 14 caractères
        if (strlen($password) < 14) {
            return false;
        }

        // Vérifie la présence d'au moins une majuscule
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }

        // Vérifie la présence d'au moins une minuscule
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }

        // Vérifie la présence d'au moins un chiffre
        if (!preg_match('/\d/', $password)) {
            return false;
        }

        // Vérifie la présence d'au moins un caractère spécial
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return false;
        }

        // Si tous les critères sont remplis, le mot de passe est considéré comme fort
        return true;
    }
}