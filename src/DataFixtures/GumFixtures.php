<?php

namespace App\DataFixtures;

use App\Entity\Gum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class GumFixtures extends Fixture implements OrderedFixtureInterface
{
    public const GUM_X         = 'gum.GUM-X';
    public const GUM_X3D       = 'gum.GUM-X3D';
    public const MAGI_X        = 'gum.MAGI-X';
    public const MAGI_X_GREEN  = 'gum.MAGI-X-GREEN';
    public const MAGI_X2       = 'gum.MAGI-X2';
    public const E_GUM_X       = 'gum.E-GUM-X';
    public const MAGI_X_GUM_X  = 'gum.MAGI-X+GUM-X';

    private const COMPOUNDS = [
        [self::GUM_X,        'GUM-X',           'Road racing'],
        [self::GUM_X3D,      'GUM-X3D',         'All-conditions racing'],
        [self::MAGI_X,       'MAGI-X',           'All terrain'],
        [self::MAGI_X_GREEN, 'MAGI-X GREEN',     'Eco all terrain'],
        [self::MAGI_X2,      'MAGI-X2',          'Trail & enduro'],
        [self::E_GUM_X,      'E-GUM-X',          'E-bike reinforced'],
        [self::MAGI_X_GUM_X, 'MAGI-X + GUM-X',  'Dual compound mixed terrain'],
    ];

    public function load(ObjectManager $manager): void
    {
        foreach (self::COMPOUNDS as [$refKey, $name, $gripType]) {
            $gum = (new Gum())->setName($name)->setGripType($gripType);
            $manager->persist($gum);
            $this->addReference($refKey, $gum);
        }

        $manager->flush();
    }

    public function getOrder(): int
    {
        return 1;
    }
}
