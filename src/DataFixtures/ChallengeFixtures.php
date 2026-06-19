<?php

namespace App\DataFixtures;

use App\Entity\Challenge;
use App\Entity\Objective;
use App\Entity\Reward;
use App\Enum\ObjectiveType;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;

class ChallengeFixtures extends Fixture implements OrderedFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Skill tree structure:
        //
        //        Sprint Urbain          (Tier 1 — root, easy)
        //             |
        //       Rouler 30 jours         (Tier 2 — requires Sprint Urbain)
        //        /          \
        // Grimpeur Alpes   Endurance 50h (Tier 3 — each requires Rouler 30j)
        //        \          /
        //   Grand Tour Michelin          (Tier 4 — boss, requires Grimpeur)

        $challenges = [
            'sprint' => [
                'title' => 'Sprint Urbain',
                'description' => 'Roulez 200 km en ville en un mois. Le premier pas vers les sommets.',
                'startDate' => '2026-06-01',
                'endDate' => '2026-12-31',
                'tier' => 1,
                'prerequisite' => null,
                'objectives' => [
                    ['type' => ObjectiveType::DISTANCE, 'value' => 200],
                ],
                'reward' => [
                    'name' => 'Sacoche Michelin Urban',
                    'description' => 'Sacoche de cadre imperméable Michelin, parfaite pour le vélotaf.',
                    'image' => 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&h=400&fit=crop',
                ],
            ],
            'regulier' => [
                'title' => 'Rouler 30 jours',
                'description' => 'Pédalez au moins 30 jours ce semestre. La régularité forge les champions.',
                'startDate' => '2026-04-01',
                'endDate' => '2026-12-31',
                'tier' => 2,
                'prerequisite' => 'sprint',
                'objectives' => [
                    ['type' => ObjectiveType::FREQUENCY, 'value' => 30],
                    ['type' => ObjectiveType::DURATION, 'value' => 1800],
                ],
                'reward' => [
                    'name' => 'Bidon Michelin Pro Team',
                    'description' => 'Bidon isotherme 750ml aux couleurs Michelin, design pro team.',
                    'image' => 'https://images.unsplash.com/photo-1571188654248-7a89013e5f26?w=600&h=400&fit=crop',
                ],
            ],
            'grimpeur' => [
                'title' => 'Grimpeur des Alpes',
                'description' => 'Cumulez 10 000 m de dénivelé positif. Cols mythiques et routes légendaires vous attendent.',
                'startDate' => '2026-05-01',
                'endDate' => '2026-12-31',
                'tier' => 3,
                'prerequisite' => 'regulier',
                'objectives' => [
                    ['type' => ObjectiveType::ELEVATION, 'value' => 10000],
                    ['type' => ObjectiveType::DISTANCE, 'value' => 500],
                ],
                'reward' => [
                    'name' => 'Maillot Michelin x Alpine Edition',
                    'description' => 'Maillot cycliste édition limitée Michelin Alpine, tissu technique respirant.',
                    'image' => 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop',
                ],
            ],
            'endurance' => [
                'title' => 'Endurance 50h',
                'description' => 'Accumulez 50 heures de pédalage. Chaque minute compte pour ce défi d\'endurance.',
                'startDate' => '2026-03-01',
                'endDate' => '2026-12-31',
                'tier' => 3,
                'prerequisite' => 'regulier',
                'objectives' => [
                    ['type' => ObjectiveType::DURATION, 'value' => 3000],
                    ['type' => ObjectiveType::DISTANCE, 'value' => 800],
                    ['type' => ObjectiveType::ELEVATION, 'value' => 8000],
                ],
                'reward' => [
                    'name' => 'Pack Michelin Performance',
                    'description' => 'Pack complet : 2 pneus Michelin Lithion 3 + chambre à air AirComp Latex.',
                    'image' => 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&h=400&fit=crop',
                ],
            ],
            'grandtour' => [
                'title' => 'Grand Tour Michelin 2026',
                'description' => 'Le défi ultime. 1 000 km et 15 000 m de dénivelé pour les vrais passionnés.',
                'startDate' => '2026-01-01',
                'endDate' => '2026-12-31',
                'tier' => 4,
                'prerequisite' => 'grimpeur',
                'objectives' => [
                    ['type' => ObjectiveType::DISTANCE, 'value' => 1000],
                    ['type' => ObjectiveType::ELEVATION, 'value' => 15000],
                ],
                'reward' => [
                    'name' => 'Paire de Michelin Power Cup TLR',
                    'description' => 'Le Graal : pneus Michelin Power Cup Tubeless Ready, le choix des compétiteurs.',
                    'image' => 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=600&h=400&fit=crop',
                ],
            ],
        ];

        $entities = [];

        // First pass: create all challenges
        foreach ($challenges as $key => $data) {
            $challenge = new Challenge();
            $challenge->setTitle($data['title'])
                ->setDescription($data['description'])
                ->setStartDate(new \DateTimeImmutable($data['startDate']))
                ->setEndDate(new \DateTimeImmutable($data['endDate']));

            $reward = new Reward();
            $reward->setName($data['reward']['name'])
                ->setDescription($data['reward']['description'])
                ->setImage($data['reward']['image']);
            $challenge->setReward($reward);

            foreach ($data['objectives'] as $obj) {
                $objective = new Objective();
                $objective->setType($obj['type'])
                    ->setValue($obj['value']);
                $challenge->addObjective($objective);
                $manager->persist($objective);
            }

            $manager->persist($challenge);
            $entities[$key] = $challenge;
        }

        // Second pass: set prerequisites
        foreach ($challenges as $key => $data) {
            if ($data['prerequisite'] !== null && isset($entities[$data['prerequisite']])) {
                $entities[$key]->setPrerequisite($entities[$data['prerequisite']]);
            }
        }

        $manager->flush();
    }

    public function getOrder(): int
    {
        return 0;
    }
}
