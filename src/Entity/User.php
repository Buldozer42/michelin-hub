<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_USERNAME', fields: ['username'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 255)]
    private ?string $firstName = null;

    #[ORM\Column(length: 255)]
    private ?string $lastName = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 191)]
    private ?string $username = null;

    #[ORM\OneToOne(mappedBy: 'user', cascade: ['persist', 'remove'])]
    private ?StravaAccount $stravaAccount = null;

    /**
     * @var Collection<int, Bike>
     */
    #[ORM\OneToMany(targetEntity: Bike::class, mappedBy: 'owner', cascade: ['persist', 'remove'])]
    private Collection $bikes;

    /**
     * @var Collection<int, ChallengeParticipation>
     */
    #[ORM\OneToMany(targetEntity: ChallengeParticipation::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $challengeParticipations;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->bikes = new ArrayCollection();
        $this->challengeParticipations = new ArrayCollection();
    }

    /**
      * Hash le mot de passe de l'utilisateur
      *
      * @param UserPasswordHasherInterface $passwordHasher
      * @return self
      */
    public function hashUserPassword(UserPasswordHasherInterface $passwordHasher): self
    {
        $this->password = $passwordHasher->hashPassword($this, $this->password);

        return $this;
    }


    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->username;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Ensure the session doesn't contain actual password hashes by CRC32C-hashing them, as supported since Symfony 7.3.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', $this->password);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // @deprecated, to be removed when upgrading to Symfony 8
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getStravaAccount(): ?StravaAccount
    {
        return $this->stravaAccount;
    }

    public function setStravaAccount(?StravaAccount $stravaAccount): static
    {
        // unset the owning side of the relation if necessary
        if ($stravaAccount === null && $this->stravaAccount !== null) {
            $this->stravaAccount->setUser(null);
        }

        // set the owning side of the relation if necessary
        if ($stravaAccount !== null && $stravaAccount->getUser() !== $this) {
            $stravaAccount->setUser($this);
        }

        $this->stravaAccount = $stravaAccount;

        return $this;
    }

    /**
     * @return Collection<int, Bike>
     */
    public function getBikes(): Collection
    {
        return $this->bikes;
    }

    public function addBike(Bike $bike): static
    {
        if (!$this->bikes->contains($bike)) {
            $this->bikes->add($bike);
            $bike->setOwner($this);
        }

        return $this;
    }

    public function removeBike(Bike $bike): static
    {
        if ($this->bikes->removeElement($bike)) {
            if ($bike->getOwner() === $this) {
                $bike->setOwner(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ChallengeParticipation>
     */
    public function getChallengeParticipations(): Collection
    {
        return $this->challengeParticipations;
    }

    public function addChallengeParticipation(ChallengeParticipation $challengeParticipation): static
    {
        if (!$this->challengeParticipations->contains($challengeParticipation)) {
            $this->challengeParticipations->add($challengeParticipation);
            $challengeParticipation->setUser($this);
        }

        return $this;
    }

    public function removeChallengeParticipation(ChallengeParticipation $challengeParticipation): static
    {
        if ($this->challengeParticipations->removeElement($challengeParticipation)) {
            // set the owning side to null (unless already changed)
            if ($challengeParticipation->getUser() === $this) {
                $challengeParticipation->setUser(null);
            }
        }

        return $this;
    }
}
