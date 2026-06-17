<?php
namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
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
        // Get the JSON payload from the request
        $data = json_decode($request->getContent(), true);

        // Extract and validate the required fields from the payload
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

        // Validate the strength of the password
        if (!$this->isStrongPassword($password)) {
            return $this->json([
                'error' => 'The password must be at least 14 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character',
            ], 400);
        }

        // Validate the email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Invalid email address'], 400);
        }

        // Check that the username and email are not already in use
        if (
            $manager->getRepository(User::class)->findOneBy(['username' => $username]) ||
            $manager->getRepository(User::class)->findOneBy(['email' => $email])
        ) {
            return $this->json(['error' => 'This account is already in use'], 409);
        }

        // Create the user
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

        // Return a success response with the user ID
        return $this->json([
            'message' => 'Registration successful',
            'userId' => $user->getId(),
        ], 201);
    }

    /**
     * Checks if a password is strong enough according to the following criteria:
     * - At least 14 characters
     * - Contains at least one uppercase letter
     * - Contient at least one lowercase letter
     * - Contient at least one digit
     * - Contient at least one special character
     *
     * @param string $password The password to check
     * @return bool True if the password is strong, false otherwise
     */
    private function isStrongPassword(string $password): bool
    {
        // Check the length of the password
        if (strlen($password) < 14) {
            return false;
        }

        // Check for at least one uppercase letter
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }

        // Check for at least one lowercase letter
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }

        // Check for at least one digit
        if (!preg_match('/\d/', $password)) {
            return false;
        }

        // Check for at least one special character
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return false;
        }

        // If all criteria are met, the password is considered strong
        return true;
    }
}