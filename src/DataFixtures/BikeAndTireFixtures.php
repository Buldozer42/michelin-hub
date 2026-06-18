<?php

namespace App\DataFixtures;

use App\Entity\Bike;
use App\Entity\Gum;
use App\Entity\Tire;
use App\Entity\TireLine;
use App\Entity\User;
use App\Enum\BikeType;
use App\Enum\TireBead;
use App\Enum\TireFitting;
use App\Enum\TirePosition;
use App\Enum\TireSealing;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class BikeAndTireFixtures extends Fixture implements OrderedFixtureInterface
{
    /**
     * Each entry: [line_name, cai, section_width, outer_diameter, tpi, weight_g,
     *              sealing, bead, fitting, min_bar, max_bar, terrain, use, gum_ref|null]
     */
    private const ROAD_TIRES = [
        ['MICHELIN POWER TIME TRIAL RACING LINE',           '664143', 23, 700, '3X150', 180,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  8.0,  'ASPHALT',                                     'RACING',              GumFixtures::GUM_X],
        ['MICHELIN POWER CUP S RACING LINE',                '531838', 28, 700, '3X120', 290,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 7.0,  'ASPHALT',                                     'RACING',              GumFixtures::GUM_X],
        ['MICHELIN POWER GRAVEL RS RACING LINE',            '564848', 42, 700, '3X120', 445,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 4.5,  'ASPHALT,OFFROAD HARD PACKED',                 'RACING,E-GRAVEL',     GumFixtures::GUM_X],
        ['MICHELIN POWER PROTECTION TLR COMPETITION LINE',  '074960', 28, 700, '3X120', 315,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 4.0,  6.0,  'ASPHALT',                                     'ENDURANCE',           GumFixtures::MAGI_X],
        ['MICHELIN POWER ALL SEASON COMPETITION LINE',      '146404', 25, 700, '3X55',  270,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  7.5,  'ASPHALT',                                     'ALL ROAD',            GumFixtures::MAGI_X],
        ['MICHELIN POWER ADVENTURE COMPETITION LINE',       '621328', 48, 650, '3X100', 510,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 2.5,  4.0,  'ASPHALT,OFFROAD HARD PACKED',                 'SPEED,TOURING',       GumFixtures::GUM_X],
        ['MICHELIN POWER GRAVEL COMPETITION LINE',          '188365', 50, 650, '3X120', 580,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 2.5,  4.0,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TREKKING,E-GRAVEL',   GumFixtures::MAGI_X],
        ['MICHELIN POWER GRAVEL EXTREME COMPETITION LINE',  '216772', 42, 700, '3X120', 570,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 4.5,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TRAIL,E-GRAVEL',      GumFixtures::GUM_X],
        ['MICHELIN POWER ROAD COMPETITION LINE',            '017605', 25, 700, '3X120', 235,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  8.0,  'ASPHALT',                                     'RACING',              null],
        ['MICHELIN POWER ROAD TLR COMPETITION LINE',        '876172', 25, 700, '4X120', 275,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  8.0,  'ASPHALT',                                     'RACING',              null],
        ['MICHELIN POWER CUP COMPETITION LINE',             '668854', 23, 700, '3X120', 205,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 6.0,  8.0,  'ASPHALT',                                     'RACING',              GumFixtures::GUM_X],
        ['MICHELIN POWER CUP TLR COMPETITION LINE',         '176421', 25, 700, '3X120', 260,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  8.0,  'ASPHALT',                                     'RACING',              GumFixtures::GUM_X],
        ['MICHELIN PRO5 TLR COMPETITION LINE',              '139901', 28, 700, '3X120', 310,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 7.0,  'ASPHALT',                                     'ENDURANCE',           GumFixtures::GUM_X],
        ['MICHELIN PRO5 COMPETITION LINE',                  '478236', 25, 700, '3X110', 245,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 5.0,  7.5,  'ASPHALT',                                     'ENDURANCE',           GumFixtures::GUM_X],
        ['MICHELIN POWER CYCLOCROSS JET COMPETITION LINE',  '762322', 33, 700, '3X120', 390,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 3.0,  5.0,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'CYCLOCROSS',          GumFixtures::MAGI_X],
        ['MICHELIN POWER CYCLOCROSS MUD COMPETITION LINE',  '818285', 33, 700, '3X120', 390,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 3.0,  5.0,  'OFFROAD MIXED,OFFROAD SOFT,OFFROAD MUD',      'CYCLOCROSS',          GumFixtures::MAGI_X],
        ['MICHELIN LITHION 2 PERFORMANCE LINE',             '439162', 23, 700, '3X55',  220,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 6.0,  8.0,  'ASPHALT',                                     'ENDURANCE',           null],
        ['MICHELIN LITHION 4 PERFORMANCE LINE',             '303721', 23, 700, '3X55',  240,  TireSealing::TUBE_TYPE,      TireBead::FOLDABLE, TireFitting::FRONT_REAR, 6.0,  8.0,  'ASPHALT',                                     'ENDURANCE,E-ROAD',    GumFixtures::MAGI_X],
        ['MICHELIN DYNAMIC CLASSIC ACCESS LINE',            '984157', 20, 700, '3X30',  275,  TireSealing::TUBE_TYPE,      TireBead::WIRE,     TireFitting::FRONT_REAR, 6.0,  8.0,  'ASPHALT',                                     'LEISURE',             null],
        ['MICHELIN DYNAMIC SPORT ACCESS LINE',              '002895', 23, 700, '3X30',  315,  TireSealing::TUBE_TYPE,      TireBead::WIRE,     TireFitting::FRONT_REAR, 6.0,  8.0,  'ASPHALT',                                     'LEISURE',             null],
    ];

    private const MTB_TIRES = [
        ['MICHELIN WILD ENDURO FRONT RACING LINE',        '475741', 61, 622, '2X55',     1400, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT,      1.5,  4.0,  'OFFROAD MIXED',                               'ENDURO',              null],
        ['MICHELIN WILD ENDURO REAR RACING LINE',         '661840', 61, 622, '2X55',     1350, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::REAR,       1.8,  4.0,  'OFFROAD HARD PACKED,OFFROAD MIXED',           'ENDURO',              GumFixtures::MAGI_X],
        ['MICHELIN WILD ENDURO MH RACING LINE',           '699740', 63, 584, '2X55',     1295, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.5,  4.0,  'OFFROAD HARD PACKED,OFFROAD MIXED',           'ENDURO',              GumFixtures::MAGI_X],
        ['MICHELIN WILD ENDURO MS RACING LINE',           '737025', 61, 584, '2X55',     1235, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.5,  4.0,  'OFFROAD MIXED,OFFROAD SOFT',                  'ENDURO',              GumFixtures::MAGI_X],
        ['MICHELIN DH16 RACING LINE',                     '372839', 61, 584, '1X55/1X120', 1280, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 4.0, 'OFFROAD HARD PACKED,OFFROAD MIXED',          'DOWNHILL',            GumFixtures::MAGI_X],
        ['MICHELIN DH22 RACING LINE',                     '623988', 61, 584, '4X55',     1440, TireSealing::TUBELESS_READY, TireBead::WIRE,     TireFitting::FRONT_REAR, 1.5,  4.0,  'OFFROAD MIXED,OFFROAD SOFT',                  'DOWNHILL',            GumFixtures::MAGI_X],
        ['MICHELIN DH22 RACING LINE (FOLDABLE BEAD)',     '512508', 61, 584, '1X55/1X120', 1260, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 4.0, 'OFFROAD MIXED,OFFROAD SOFT',                 'DOWNHILL',            GumFixtures::MAGI_X],
        ['MICHELIN DH34 RACING LINE',                     '897304', 61, 559, '2X55',     1340, TireSealing::TUBELESS_READY, TireBead::WIRE,     TireFitting::FRONT_REAR, 1.5,  4.0,  'OFFROAD HARD PACKED,OFFROAD MIXED',           'DOWNHILL',            GumFixtures::MAGI_X],
        ['MICHELIN DH MUD RACING LINE',                   '570539', 61, 584, '4X55',     1420, TireSealing::TUBELESS_READY, TireBead::WIRE,     TireFitting::FRONT_REAR, 1.8,  4.0,  'SOFT,MUD',                                    'DOWNHILL',            GumFixtures::MAGI_X],
        ['MICHELIN PILOT SX SLICK RACING LINE',           '490631', 44, 406, '4X120',    420,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 2.0,  5.0,  'ASPHALT,OFFROAD HARD PACKED',                 'BMX RACING',          null],
        ['MICHELIN PILOT SX RACING LINE',                 '764428', 37, 451, '3X62',     400,  TireSealing::TUBE_TYPE,      TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  5.0,  'OFFROAD HARD PACKED',                         'BMX RACING',          null],
        ['MICHELIN PILOT SX RACING LINE (FOLDABLE BEAD)', '240271', 44, 406, '4X120',    400,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 2.0,  5.0,  'OFFROAD HARD PACKED',                         'BMX RACING',          null],
        ['MICHELIN PILOT FREESTYLE RACING LINE',          '959153', 53, 406, '3X62',     585,  TireSealing::TUBE_TYPE,      TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  7.0,  'ASPHALT,OFFROAD HARD PACKED',                 'BMX FREESTYLE',       GumFixtures::MAGI_X],
        ['MICHELIN FORCE XC2 RACING LINE',                '489593', 54, 622, '2X150',    680,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.8,  4.0,  'OFFROAD MIXED',                               'CROSS COUNTRY',       GumFixtures::GUM_X],
        ['MICHELIN JET XC2 RACING LINE',                  '901034', 57, 622, '2X150',    710,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.8,  4.0,  'OFFROAD HARD PACKED',                         'CROSS COUNTRY',       GumFixtures::GUM_X],
        ['MICHELIN WILD XC RACING LINE',                  '986167', 57, 622, '2X150',    730,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.8,  4.0,  'OFFROAD MIXED,OFFROAD SOFT',                  'CROSS COUNTRY',       GumFixtures::GUM_X],
        ['MICHELIN E-WILD FRONT RACING LINE',             '445579', 61, 622, '2X55',     1290, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT,      null, 4.0,  'OFFROAD MIXED',                               'E-ENDURO',            GumFixtures::MAGI_X],
        ['MICHELIN E-WILD REAR RACING LINE',              '090532', 65, 584, '2X55',     1275, TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::REAR,       null, 4.0,  'OFFROAD MIXED',                               'E-ENDURO',            GumFixtures::MAGI_X],
        ['MICHELIN FORCE XC3 RACING LINE',                '704051', 55, 622, '3X120',    700,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 2.5,  'OFFROAD MIXED',                               'CROSS COUNTRY',       GumFixtures::GUM_X],
        ['MICHELIN JET XC3 RACING LINE',                  '275343', 55, 622, '3X120',    680,  TireSealing::TUBELESS_READY, TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 2.5,  'OFFROAD HARD PACKED',                         'CROSS COUNTRY',       GumFixtures::GUM_X],
    ];

    private const CITY_TIRES = [
        ['MICHELIN STARGRIP COMPETITION LINE',                    '240902', 37, 700, '3X30',  680,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 3.0,  6.0,  'ASPHALT',                                     'URBAN',               null],
        ['MICHELIN CITY CARGO COMPETITION LINE',                  '349512', 55, 406, '6X62',  900,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 1.8,  5.0,  'ASPHALT',                                     'CARGO,URBAN',         GumFixtures::MAGI_X],
        ['MICHELIN CITY STREET COMPETITION LINE (FOLDABLE BEAD)', '228339', 55, 584, '3X62',  795,  TireSealing::TUBE_TYPE,  TireBead::FOLDABLE, TireFitting::FRONT_REAR, 2.0,  4.5,  'ASPHALT',                                     'URBAN,E-CITY',        GumFixtures::MAGI_X],
        ['MICHELIN CITY TOURING COMPETITION LINE (FB)',           '684544', 55, 584, '3X62',  900,  TireSealing::TUBE_TYPE,  TireBead::FOLDABLE, TireFitting::FRONT_REAR, 1.8,  4.5,  'ASPHALT,OFFROAD HARD PACKED',                 'TOURING,E-CITY',      GumFixtures::MAGI_X],
        ['MICHELIN CITY TREKKING COMPETITION LINE (FB)',          '899445', 60, 584, '3X62',  970,  TireSealing::TUBE_TYPE,  TireBead::FOLDABLE, TireFitting::FRONT_REAR, null, 3.5,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TREKKING,E-CITY',     GumFixtures::MAGI_X],
        ['MICHELIN CITY STREET PERFORMANCE LINE',                 '793238', 40, 559, '3X62',  630,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT',                                     'URBAN,E-CITY',        GumFixtures::MAGI_X],
        ['MICHELIN CITY TOURING PERFORMANCE LINE',                '921369', 35, 349, '3X62',  370,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, null, 7.5,  'ASPHALT,OFFROAD HARD PACKED',                 'TOURING,E-CITY',      GumFixtures::MAGI_X],
        ['MICHELIN CITY TREKKING PERFORMANCE LINE',               '566448', 60, 584, '3X62', 1140,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, null, 3.5,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TREKKING,E-CITY',     GumFixtures::MAGI_X],
        ['MICHELIN PROTEK CROSS MAX PERFORMANCE LINE',            '127653', 40, 559, '3X30',  980,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TREKKING',            null],
        ['MICHELIN PROTEK MAX PERFORMANCE LINE',                  '415865', 37, 406, '3X30',  625,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  5.0,  'ASPHALT,OFFROAD HARD PACKED',                 'TOURING',             null],
        ['MICHELIN WILD RUN\'R PERFORMANCE LINE',                 '605619', 35, 559, '3X33',  420,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT',                                     'URBAN',               null],
        ['MICHELIN COUNTRY J ACCESS LINE',                        '697424', 44, 305, '3X22',  440,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.0,  4.0,  'ASPHALT,OFFROAD HARD PACKED',                 'KIDS',                null],
        ['MICHELIN PROTEK ACCESS LINE',                           '014873', 37, 406, '3X22',  560,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  5.0,  'ASPHALT,OFFROAD HARD PACKED',                 'TOURING',             null],
        ['MICHELIN PROTEK CROSS ACCESS LINE',                     '892908', 40, 559, '3X22',  765,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT,OFFROAD HARD PACKED,OFFROAD MIXED',   'TREKKING',            null],
        ['MICHELIN CITY J ACCESS LINE',                           '001663', 47, 203, '3X22',  290,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.0,  4.0,  'ASPHALT',                                     'KIDS',                null],
        ['MICHELIN WORLDTOUR ACCESS LINE',                        '124619', 35, 584, '3X22',  560,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT',                                     'TOURING',             null],
        ['MICHELIN ZZ ACCESS LINE',                               '404313', 44, 584, '3X22',  605,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.5,  6.0,  'ASPHALT',                                     'TOURING',             null],
        ['MICHELIN COUNTRY ROCK ACCESS LINE',                     '966280', 44, 559, '3X30',  610,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.0,  4.0,  'ASPHALT,OFFROAD HARD PACKED',                 'TREKKING',            null],
        ['MICHELIN CITY CARGO COMPETITION LINE',                  '665728', 60, 406, '6X62',  920,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 2.0,  5.0,  'ASPHALT',                                     'CARGO,URBAN',         GumFixtures::MAGI_X],
        ['MICHELIN CITY CARGO COMPETITION LINE',                  '470331', 55, 507, '6X62', 1100,  TireSealing::TUBE_TYPE,  TireBead::WIRE,     TireFitting::FRONT_REAR, 1.8,  5.0,  'ASPHALT',                                     'CARGO,URBAN',         GumFixtures::MAGI_X],
    ];

    private const ROAD_BIKES = [
        ['Colnago C68',         'Colnago',       'C68 Disc',              BikeType::ROAD,     6.8,  '2022-03-15', 12400.0],
        ['Trek Émonda SLR',     'Trek',          'Émonda SLR 9',          BikeType::ROAD,     7.1,  '2023-06-01',  8750.0],
        ['Specialized Tarmac',  'Specialized',   'Tarmac SL7 Pro',        BikeType::ROAD,     7.3,  '2022-09-20',  6300.0],
        ['Pinarello Dogma',     'Pinarello',     'Dogma F',               BikeType::ROAD,     7.0,  '2024-01-10',  3200.0],
        ['BMC Teammachine',     'BMC',           'SLR01 Disc One',        BikeType::ROAD,     7.2,  '2021-04-05', 15800.0],
        ['Ridley Helium SLX',   'Ridley',        'Helium SLX Disc',       BikeType::ROAD,     7.5,  '2023-11-12',  9100.0],
        ['Canyon Ultimate',     'Canyon',        'Ultimate CFR AXS',      BikeType::ROAD,     7.0,  '2024-02-28',  4500.0],
        ['Cannondale SuperSix', 'Cannondale',    'SuperSix EVO HiMod',    BikeType::ROAD,     7.1,  '2022-07-18', 11200.0],
        ['Scott Addict RC',     'Scott',         'Addict RC 15',          BikeType::ROAD,     7.3,  '2023-03-30',  7600.0],
        ['Orbea Orca',          'Orbea',         'Orca M20iLTD',          BikeType::ROAD,     7.4,  '2024-04-01',  2800.0],
    ];

    private const MTB_BIKES = [
        ['Trek Slash 9.9',      'Trek',          'Slash 9.9 XTR',         BikeType::MOUNTAIN, 13.5, '2023-01-15',  5200.0],
        ['Santa Cruz Bronson',  'Santa Cruz',    'Bronson CC X0 AXS',     BikeType::MOUNTAIN, 14.2, '2022-05-20',  3800.0],
        ['Specialized Enduro',  'Specialized',   'Enduro Pro',            BikeType::MOUNTAIN, 14.8, '2023-08-10',  6700.0],
        ['YT Capra',            'YT Industries', 'Capra Core 3',          BikeType::MOUNTAIN, 14.5, '2021-10-05',  9400.0],
        ['Commencal Supreme',   'Commencal',     'Supreme DH V5',         BikeType::MOUNTAIN, 16.8, '2022-03-25',  1800.0],
        ['GT Fury Carbon',      'GT',            'Fury Carbon Expert',     BikeType::MOUNTAIN, 17.0, '2023-06-12',  2200.0],
        ['Scott Ransom 910',    'Scott',         'Ransom 910',            BikeType::MOUNTAIN, 15.2, '2024-01-08',  4900.0],
        ['Canyon Sender CFR',   'Canyon',        'Sender CFR',            BikeType::MOUNTAIN, 16.5, '2022-09-14',  1500.0],
        ['Ibis HD6',            'Ibis',          'HD6',                   BikeType::MOUNTAIN, 14.1, '2023-02-20',  7800.0],
        ['Norco Sight',         'Norco',         'Sight A1',              BikeType::MOUNTAIN, 15.8, '2021-07-30',  3600.0],
    ];

    private const CITY_BIKES = [
        ['Riese Müller Charger',  'Riese & Müller', 'Charger4 GT',          BikeType::ELECTRIC, 25.0, '2023-04-10',  4200.0],
        ['VanMoof S5',            'VanMoof',         'S5',                   BikeType::ELECTRIC, 21.0, '2022-08-15',  3100.0],
        ['Brompton Electric',     'Brompton',        'Electric P-Line Urban', BikeType::ELECTRIC, 16.5, '2024-01-20',  1800.0],
        ['Trek FX+',              'Trek',            'FX+ 2 Disc',           BikeType::ELECTRIC, 20.5, '2023-07-05',  5600.0],
        ['Giant Escape City E+',  'Giant',           'Escape City E+ 1 Pro', BikeType::ELECTRIC, 21.5, '2022-11-30',  7200.0],
        ['Pelago Stavanger',      'Pelago',          'Stavanger Single Speed', BikeType::URBAN,  10.8, '2023-02-14',  9800.0],
        ['Raleigh Pioneer',       'Raleigh',         'Pioneer Trail',        BikeType::URBAN,    13.0, '2021-06-01', 11500.0],
        ['Specialized Sirrus X',  'Specialized',     'Sirrus X 4.0',         BikeType::URBAN,    11.8, '2024-03-15',  3400.0],
        ['Tout Terrain Silkroad', 'Tout Terrain',    'Silkroad Plus',        BikeType::URBAN,    12.5, '2022-04-22',  6700.0],
        ['Veloheld Frame',        'Veloheld',        'Frame Single Speed',   BikeType::URBAN,    11.5, '2023-09-08',  4300.0],
    ];

    public function load(ObjectManager $manager): void
    {
        $users = $manager->getRepository(User::class)->findAll();
        $userCount = count($users);

        if ($userCount === 0) {
            return;
        }

        $this->loadBikeGroup($manager, self::ROAD_BIKES,  self::ROAD_TIRES,  $users, $userCount);
        $this->loadBikeGroup($manager, self::MTB_BIKES,   self::MTB_TIRES,   $users, $userCount);
        $this->loadBikeGroup($manager, self::CITY_BIKES,  self::CITY_TIRES,  $users, $userCount);

        $manager->flush();
    }

    private function loadBikeGroup(
        ObjectManager $manager,
        array $bikeSpecs,
        array $tireData,
        array $users,
        int $userCount,
    ): void {
        foreach ($bikeSpecs as $i => [$name, $brand, $model, $bikeType, $weight, $purchaseDateStr, $totalDistance]) {
            $bike = (new Bike())
                ->setName($name)
                ->setBrand($brand)
                ->setModel($model)
                ->setBikeType($bikeType)
                ->setWeight($weight)
                ->setPurchaseDate(new \DateTimeImmutable($purchaseDateStr))
                ->setTotalDistance($totalDistance)
                ->setOwner($users[$i % $userCount]);

            $manager->persist($bike);

            // Each bike gets 2 tires (front + rear) from paired entries
            $frontIndex = ($i * 2) % count($tireData);
            $rearIndex  = ($i * 2 + 1) % count($tireData);

            $manager->persist($this->makeTire($tireData[$frontIndex], TirePosition::FRONT, $bike));
            $manager->persist($this->makeTire($tireData[$rearIndex],  TirePosition::REAR,  $bike));
        }
    }

    /**
     * @param array{0:string,1:string,2:int,3:int,4:string,5:int,6:TireSealing,7:TireBead,8:TireFitting,9:float|null,10:float|null,11:string,12:string,13:string|null} $data
     */
    private function makeTire(array $data, TirePosition $position, Bike $bike): Tire
    {
        [$lineName, $cai, $sectionWidth, $outerDiameter, $tpi, $weight,
         $sealing, $bead, $fitting, $minBar, $maxBar, $terrain, $use, $gumRef] = $data;

        /** @var TireLine $tireLine */
        $tireLine = $this->getReference(TireLineFixtures::PREFIX . $lineName, TireLine::class);

        $gum = $gumRef !== null
            ? $this->getReference($gumRef, Gum::class)
            : null;

        $etrto = $sectionWidth . '-' . $outerDiameter;

        return (new Tire())
            ->setBike($bike)
            ->setCai($cai)
            ->setBrand('MICHELIN')
            ->setModel($lineName)
            ->setPosition($position)
            ->setFitting($fitting)
            ->setSealing($sealing)
            ->setBead($bead)
            ->setSectionWidth($sectionWidth)
            ->setOuterDiameter($outerDiameter)
            ->setEtrto($etrto)
            ->setTpi($tpi)
            ->setWeight($weight)
            ->setMinPressureBar($minBar)
            ->setMaxPressureBar($maxBar)
            ->setTerrainTypes($terrain ?: null)
            ->setInstalledAtKm(0.0)
            ->setExpectedLifespanKm($this->expectedLifespan($lineName))
            ->setTireLine($tireLine)
            ->setGum($gum);
    }

    private function expectedLifespan(string $lineName): int
    {
        return match (true) {
            str_contains($lineName, 'RACING LINE')      => 4000,
            str_contains($lineName, 'COMPETITION LINE') => 6000,
            str_contains($lineName, 'PERFORMANCE LINE') => 8000,
            default                                      => 10000,
        };
    }

    public function getOrder(): int
    {
        return 3;
    }
}
