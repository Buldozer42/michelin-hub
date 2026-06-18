<?php

namespace App\DataFixtures;

use App\Entity\TireLine;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class TireLineFixtures extends Fixture implements OrderedFixtureInterface
{
    // Reference key prefix
    public const PREFIX = 'tire_line.';

    /**
     * [name, manufacturer, description, url]
     */
    private const LINES = [
        // ── ROAD ──────────────────────────────────────────────────────────────
        ['MICHELIN POWER TIME TRIAL RACING LINE',            'Michelin', 'Pneu tubetype ultra-léger pour le contre-la-montre. Gomme GUM-X, 3x150 TPI.',                            'https://www.michelinman.com/'],
        ['MICHELIN POWER CUP S RACING LINE',                 'Michelin', 'Pneu tubeless-ready de compétition, successeur du Power Cup. Protection Tubeless Shield V2.',           'https://www.michelinman.com/'],
        ['MICHELIN POWER GRAVEL RS RACING LINE',             'Michelin', 'Pneu gravel tubeless haut de gamme pour les épreuves de gravel racing.',                               'https://www.michelinman.com/'],
        ['MICHELIN POWER PROTECTION TLR COMPETITION LINE',   'Michelin', 'Endurance et protection renforcée pour rouler par tous les temps, compatible tubeless.',               'https://www.michelinman.com/'],
        ['MICHELIN POWER ALL SEASON COMPETITION LINE',       'Michelin', 'Pneu 4-saisons route avec protection Aramid Shield pour une utilisation quotidienne intensive.',       'https://www.michelinman.com/'],
        ['MICHELIN POWER ADVENTURE COMPETITION LINE',        'Michelin', 'Pneu polyvalent bikepacking 650B, tubeless ready, terrain mixte asphalte/gravel.',                    'https://www.michelinman.com/'],
        ['MICHELIN POWER GRAVEL COMPETITION LINE',           'Michelin', 'Pneu gravel tubeless 650B pour un usage polyvalent route et chemins.',                                 'https://www.michelinman.com/'],
        ['MICHELIN POWER GRAVEL EXTREME COMPETITION LINE',   'Michelin', 'Pneu gravel tubeless pour terrains extrêmes mixtes, asphalte jusqu\'à boue légère.',                  'https://www.michelinman.com/'],
        ['MICHELIN POWER ROAD COMPETITION LINE',             'Michelin', 'Pneu route de compétition classique, version tubetype foldable.',                                      'https://www.michelinman.com/'],
        ['MICHELIN POWER ROAD TLR COMPETITION LINE',         'Michelin', 'Version tubeless du Power Road, 4x120 TPI pour une résistance maximale.',                              'https://www.michelinman.com/'],
        ['MICHELIN POWER CUP COMPETITION LINE',              'Michelin', 'Pneu de course tubetype, carcasse 3x120 TPI et protection Aramid Shield.',                             'https://www.michelinman.com/'],
        ['MICHELIN POWER CUP TLR COMPETITION LINE',          'Michelin', 'Pneu de course tubeless, carcasse 3x120 TPI avec protection Tubeless Shield.',                         'https://www.michelinman.com/'],
        ['MICHELIN PRO5 TLR COMPETITION LINE',               'Michelin', 'Endurance tubeless longue distance, protection Bead to Bead Shield et gomme GUM-X.',                  'https://www.michelinman.com/'],
        ['MICHELIN PRO5 COMPETITION LINE',                   'Michelin', 'Endurance tubetype pli kevlar, carcasse 3x110 TPI.',                                                   'https://www.michelinman.com/'],
        ['MICHELIN POWER CYCLOCROSS JET COMPETITION LINE',   'Michelin', 'Pneu cyclocross tubeless terrains mixtes secs à semi-boueux, crampons fins.',                         'https://www.michelinman.com/'],
        ['MICHELIN POWER CYCLOCROSS MUD COMPETITION LINE',   'Michelin', 'Pneu cyclocross tubeless pour terrains détrempés et boueux, crampons espacement large.',              'https://www.michelinman.com/'],
        ['MICHELIN LITHION 2 PERFORMANCE LINE',              'Michelin', 'Pneu entraînement route entrée de gamme performance, léger et résistant.',                            'https://www.michelinman.com/'],
        ['MICHELIN LITHION 4 PERFORMANCE LINE',              'Michelin', 'Pneu entraînement route compatible e-bike, gomme MAGI-X.',                                             'https://www.michelinman.com/'],
        ['MICHELIN DYNAMIC CLASSIC ACCESS LINE',             'Michelin', 'Pneu route entrée de gamme talon acier, idéal pour le loisir.',                                        'https://www.michelinman.com/'],
        ['MICHELIN DYNAMIC SPORT ACCESS LINE',               'Michelin', 'Pneu route loisir talon acier, bon rapport qualité-prix.',                                             'https://www.michelinman.com/'],
        // ── MTB ───────────────────────────────────────────────────────────────
        ['MICHELIN WILD ENDURO FRONT RACING LINE',           'Michelin', 'Pneu avant enduro 29" tubeless, carcasse 2x55 TPI, grande accroche.',                                  'https://www.michelinman.com/'],
        ['MICHELIN WILD ENDURO REAR RACING LINE',            'Michelin', 'Pneu arrière enduro 29" tubeless, protection Bead to Bead et Pinch Protection.',                      'https://www.michelinman.com/'],
        ['MICHELIN WILD ENDURO MH RACING LINE',              'Michelin', 'Wild Enduro 27.5" terrain mixte-dur (Mixed Hard), usage avant/arrière.',                               'https://www.michelinman.com/'],
        ['MICHELIN WILD ENDURO MS RACING LINE',              'Michelin', 'Wild Enduro 27.5" terrain mixte-soft (Mixed Soft), usage avant/arrière.',                              'https://www.michelinman.com/'],
        ['MICHELIN DH16 RACING LINE',                        'Michelin', 'Pneu descente 27.5" carcasse mixte 1x55/1x120 TPI, terrain mixte-dur.',                               'https://www.michelinman.com/'],
        ['MICHELIN DH22 RACING LINE',                        'Michelin', 'Pneu descente 27.5" carcasse 4x55 TPI talon acier, terrain mixte-soft.',                               'https://www.michelinman.com/'],
        ['MICHELIN DH22 RACING LINE (FOLDABLE BEAD)',        'Michelin', 'DH22 version pli kevlar, plus légère et transportable.',                                               'https://www.michelinman.com/'],
        ['MICHELIN DH34 RACING LINE',                        'Michelin', 'Pneu descente 26" carcasse 2x55 TPI, protection Hi-Density Shield.',                                   'https://www.michelinman.com/'],
        ['MICHELIN DH MUD RACING LINE',                      'Michelin', 'Pneu descente spécial boue 27.5", crampons espacement maximal.',                                       'https://www.michelinman.com/'],
        ['MICHELIN PILOT SX SLICK RACING LINE',              'Michelin', 'Pneu BMX racing 20" slick tubeless, 4x120 TPI.',                                                       'https://www.michelinman.com/'],
        ['MICHELIN PILOT SX RACING LINE',                    'Michelin', 'Pneu BMX racing 20x1 3/8" talon acier, carcasse 3x62 TPI.',                                            'https://www.michelinman.com/'],
        ['MICHELIN PILOT SX RACING LINE (FOLDABLE BEAD)',    'Michelin', 'Pneu BMX racing 20" tubeless pli kevlar, 4x120 TPI.',                                                  'https://www.michelinman.com/'],
        ['MICHELIN PILOT FREESTYLE RACING LINE',             'Michelin', 'Pneu BMX freestyle 20x2.10", gomme MAGI-X.',                                                           'https://www.michelinman.com/'],
        ['MICHELIN FORCE XC2 RACING LINE',                   'Michelin', 'Pneu XC 29" cross-country tubeless, carcasse Cross Shield², légèreté et performance.',                'https://www.michelinman.com/'],
        ['MICHELIN JET XC2 RACING LINE',                     'Michelin', 'Pneu XC 29" rolling fast sur terrains durs, carcasse Cross Shield².',                                  'https://www.michelinman.com/'],
        ['MICHELIN WILD XC RACING LINE',                     'Michelin', 'Pneu XC 29" terrains mixtes-soft, carcasse Cross Shield², gomme GUM-X.',                              'https://www.michelinman.com/'],
        ['MICHELIN E-WILD FRONT RACING LINE',                'Michelin', 'Pneu avant VTT e-bike 29", homologué e-bike, protection renforcée.',                                   'https://www.michelinman.com/'],
        ['MICHELIN E-WILD REAR RACING LINE',                 'Michelin', 'Pneu arrière VTT e-bike 27.5x2.60", homologué e-bike, protection renforcée.',                          'https://www.michelinman.com/'],
        ['MICHELIN FORCE XC3 RACING LINE',                   'Michelin', 'Pneu XC 29" nouvelle génération, carcasse Bead to Bead Shield, 3x120 TPI.',                           'https://www.michelinman.com/'],
        ['MICHELIN JET XC3 RACING LINE',                     'Michelin', 'Pneu XC 29" rolling terrains durs, nouvelle génération Bead to Bead Shield.',                         'https://www.michelinman.com/'],
        // ── CITY ──────────────────────────────────────────────────────────────
        ['MICHELIN STARGRIP COMPETITION LINE',               'Michelin', 'Pneu urbain hiver 700x35C talon acier, excellente accroche sur chaussée humide.',                     'https://www.michelinman.com/'],
        ['MICHELIN CITY CARGO COMPETITION LINE',             'Michelin', 'Pneu cargo et e-cargo haute résistance avec Cargo Shield, disponible en 20" et 24".',                 'https://www.michelinman.com/'],
        ['MICHELIN CITY STREET COMPETITION LINE (FOLDABLE BEAD)', 'Michelin', 'Pneu urbain 27.5x2.20" pli kevlar, City Shield, compatible Speedelec.',                         'https://www.michelinman.com/'],
        ['MICHELIN CITY TOURING COMPETITION LINE (FB)',      'Michelin', 'Pneu randonnée urbaine 27.5" pli kevlar, tout terrain asphalte + chemins.',                           'https://www.michelinman.com/'],
        ['MICHELIN CITY TREKKING COMPETITION LINE (FB)',     'Michelin', 'Pneu trekking urbain 27.5x2.40" pli kevlar, City Shield, Speedelec.',                                  'https://www.michelinman.com/'],
        ['MICHELIN CITY STREET PERFORMANCE LINE',            'Michelin', 'Pneu urbain 26x1.60" talon acier City Shield, e-bike compatible.',                                     'https://www.michelinman.com/'],
        ['MICHELIN CITY TOURING PERFORMANCE LINE',           'Michelin', 'Pneu ville 16" pour vélos pliants, City Shield, léger et résistant.',                                  'https://www.michelinman.com/'],
        ['MICHELIN CITY TREKKING PERFORMANCE LINE',          'Michelin', 'Pneu trekking 27.5x2.40" talon acier, City Shield, e-bike.',                                           'https://www.michelinman.com/'],
        ['MICHELIN PROTEK CROSS MAX PERFORMANCE LINE',       'Michelin', 'Pneu trekking 26x1.60" Max Protection, crampons mixtes asphalte et chemins.',                          'https://www.michelinman.com/'],
        ['MICHELIN PROTEK MAX PERFORMANCE LINE',             'Michelin', 'Pneu urbain 20" Max Protection, longue durée de vie.',                                                  'https://www.michelinman.com/'],
        ['MICHELIN WILD RUN\'R PERFORMANCE LINE',            'Michelin', 'Pneu urbain 26x1.40" léger et rapide pour le commuting.',                                              'https://www.michelinman.com/'],
        ['MICHELIN COUNTRY J ACCESS LINE',                   'Michelin', 'Pneu VTT enfant 16x1.75", résistant pour l\'apprentissage du vélo.',                                   'https://www.michelinman.com/'],
        ['MICHELIN PROTEK ACCESS LINE',                      'Michelin', 'Pneu urbain 20" entrée de gamme, protection anti-crevaison intégrée.',                                 'https://www.michelinman.com/'],
        ['MICHELIN PROTEK CROSS ACCESS LINE',                'Michelin', 'Pneu trekking 26x1.60" talon acier, protection anti-crevaison sur terrain mixte.',                    'https://www.michelinman.com/'],
        ['MICHELIN CITY J ACCESS LINE',                      'Michelin', 'Pneu enfant 12" pour premiers apprentissages, talon acier robuste.',                                   'https://www.michelinman.com/'],
        ['MICHELIN WORLDTOUR ACCESS LINE',                   'Michelin', 'Pneu randonnée 650x35B pour vélos de voyage, talon acier, longue durée.',                              'https://www.michelinman.com/'],
        ['MICHELIN ZZ ACCESS LINE',                          'Michelin', 'Pneu randonnée 650B S.C. robuste pour vélos de voyage.',                                               'https://www.michelinman.com/'],
        ['MICHELIN COUNTRY ROCK ACCESS LINE',                'Michelin', 'Pneu VTT loisir 26x1.75", idéal pour chemins et asphalte.',                                            'https://www.michelinman.com/'],
    ];

    public function load(ObjectManager $manager): void
    {
        foreach (self::LINES as [$name, $manufacturer, $description, $url]) {
            $line = (new TireLine())
                ->setName($name)
                ->setManufacturer($manufacturer)
                ->setDescription($description)
                ->setUrl($url);

            $manager->persist($line);
            $this->addReference(self::PREFIX . $name, $line);
        }

        $manager->flush();
    }

    public function getOrder(): int
    {
        return 2;
    }
}
