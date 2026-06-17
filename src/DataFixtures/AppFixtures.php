<?php

namespace App\DataFixtures;

use App\Entity\Article;
use App\Entity\Category;
use App\Entity\Tag;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // ── Catégories ────────────────────────────────────────────────────────

        $categories = [];
        foreach ([
            ['Destinations',     'destinations',    'Les meilleurs itinéraires et spots pour sortir rouler, de la montagne au littoral.', '#047857'],
            ['Technique',        'technique',       'Conseils techniques, fitting, aérodynamisme et prise en main de votre matériel.',     '#ea580c'],
            ['VTT',              'vtt',             'Tout-terrain, enduro, cross-country : l\'univers du mountain bike sous toutes ses formes.', '#15803d'],
            ['Mobilité urbaine', 'mobilite-urbaine','Le vélo au quotidien en ville : commuting, sécurité et équipement pratique.',          '#475569'],
            ['Entraînement',     'entrainement',    'Plans d\'entraînement, nutrition et méthodes pour progresser sur le vélo.',            '#27509b'],
            ['Compétition',      'competition',     'Actualité du cyclisme pro, grandes classiques et courses à suivre.',                   '#b91c1c'],
            ['Entretien',        'entretien',       'Mécanique vélo : guides pas à pas pour entretenir et réparer soi-même.',               '#000c34'],
        ] as [$name, $slug, $desc, $color]) {
            $cat = (new Category())
                ->setName($name)
                ->setSlug($slug)
                ->setDescription($desc)
                ->setColor($color);
            $manager->persist($cat);
            $categories[$slug] = $cat;
        }

        // ── Tags ──────────────────────────────────────────────────────────────

        $tags = [];
        foreach ([
            ['Gravel',          'gravel'],
            ['Route',           'route'],
            ['VTT',             'vtt'],
            ['Urbain',          'urbain'],
            ['Débutant',        'debutant'],
            ['Pro',             'pro'],
            ['Mécanique',       'mecanique'],
            ['Michelin',        'michelin'],
            ['Pneus',           'pneus'],
            ['Tour de France',  'tour-de-france'],
            ['Enduro',          'enduro'],
            ['Entraînement',    'entrainement'],
            ['Compétition',      'competition'],
            ['Cyclosport',      'cyclosport'],
            ['Montagne',        'montagne'],
            ['Sécurité',        'securite'],
            ['Électrique',      'electrique'],
        ] as [$name, $slug]) {
            $tag = (new Tag())->setName($name)->setSlug($slug);
            $manager->persist($tag);
            $tags[$slug] = $tag;
        }

        // ── Helper ────────────────────────────────────────────────────────────

        $t = fn(string ...$slugs) => array_map(fn($s) => $tags[$s], $slugs);
        $d = fn(string $date) => new \DateTimeImmutable($date);

        // ── Articles ──────────────────────────────────────────────────────────

        $articles = [

            // DESTINATIONS ────────────────────────────────────────────────────

            [
                'title'       => 'Le Mont Ventoux à vélo : la montée légendaire depuis Bédoin',
                'slug'        => 'mont-ventoux-velo-bedoin',
                'category'    => 'destinations',
                'tags'        => $t('route', 'montagne', 'cyclosport'),
                'viewCount'   => 4821,
                'publishedAt' => $d('2024-06-15'),
                'excerpt'     => 'Le Géant de Provence est l\'un des cols les plus mythiques du cyclisme mondial. On vous guide pour la montée depuis Bédoin, la plus belle et la plus exigeante.',
                'content'     => '<p>Avec ses 1 912 mètres d\'altitude et ses 21 km de montée depuis Bédoin, le Mont Ventoux est un passage obligé pour tout cycliste qui se respecte. La route serpente à travers les forêts de cèdres avant de déboucher sur le désert lunaire des derniers kilomètres, balayé par un vent incessant qui a donné son nom à la montagne.</p><h2>Le parcours</h2><p>Depuis Bédoin, le départ se fait en douceur dans le village. Les 6 premiers kilomètres offrent un répit relatif à 5 % de moyenne avant d\'attaquer Chalet Reynard. C\'est là que les choses sérieuses commencent : les 6 km suivants oscillent entre 8 et 10 % avec des passages à 12 %. Le mistral peut transformer cette dernière portion en véritable épreuve mentale.</p><h2>Conseils pratiques</h2><ul><li>Partez tôt le matin pour éviter la chaleur et les voitures</li><li>Emportez un coupe-vent même en été : au sommet il fait toujours frais</li><li>Hydratez-vous bien avant Chalet Reynard, la dernière fontaine avant le sommet</li><li>Comptez 1h30 à 2h30 selon votre niveau</li></ul><p>Le sommet vous offre une vue à 360° sur la Provence, les Alpes et par temps clair jusqu\'à la mer. Une récompense à la hauteur de l\'effort fourni.</p>',
            ],

            [
                'title'       => 'La Loire à vélo : 800 km de douceur angevine',
                'slug'        => 'loire-velo-itineraire-complet',
                'category'    => 'destinations',
                'tags'        => $t('route', 'debutant'),
                'viewCount'   => 3240,
                'publishedAt' => $d('2024-05-03'),
                'excerpt'     => 'L\'un des plus beaux itinéraires cyclables d\'Europe longe le plus grand fleuve de France. Accessible à tous, il traverse châteaux et vignobles.',
                'content'     => '<p>La Loire à Vélo est un itinéraire EuroVelo qui relie Cuffy (Cher) à Saint-Brévin-les-Pins sur la côte atlantique, soit environ 900 km de pistes cyclables et voies vertes sécurisées. C\'est l\'itinéraire parfait pour une première grande aventure à vélo en famille ou entre amis.</p><h2>Points forts du parcours</h2><p>Le cœur de l\'itinéraire traverse la vallée des châteaux de la Loire, classée au patrimoine mondial de l\'UNESCO. Chambord, Cheverny, Chenonceau… autant de bijoux architecturaux à découvrir à votre rythme. Le dénivelé est quasi nul sur toute la longueur, ce qui en fait un parcours idéal pour les familles avec enfants.</p><h2>Organisation pratique</h2><p>Comptez 10 à 14 jours pour parcourir l\'ensemble de l\'itinéraire à un rythme tranquille (60-80 km par jour). Des hébergements labellisés "Accueil Vélo" jalonnent tout le parcours : gîtes, chambres d\'hôtes et hôtels habituds à accueillir les cyclistes avec leurs montures. La signalétique est excellente, pas besoin de GPS.</p>',
            ],

            [
                'title'       => 'Gorges du Verdon à VTT : le paradis caché de Provence',
                'slug'        => 'gorges-verdon-vtt-provence',
                'category'    => 'destinations',
                'tags'        => $t('vtt', 'montagne', 'enduro'),
                'viewCount'   => 2180,
                'publishedAt' => $d('2024-07-22'),
                'excerpt'     => 'Les Gorges du Verdon cachent des sentiers de VTT parmi les plus spectaculaires de France, avec des points de vue à couper le souffle sur les falaises turquoise.',
                'content'     => '<p>Si les Gorges du Verdon sont connues des randonneurs et des kayakistes, elles constituent aussi un terrain de jeu exceptionnel pour les vététistes. Le plateau de Valensole et les crêtes autour de Castellane offrent des kilomètres de singletrack technique avec des panoramas sur les gorges à couper le souffle.</p><h2>Les meilleurs spots</h2><p>La boucle des Crêtes de Castellane (35 km, 1 200 m D+) est le circuit signature de la région. Elle longe les falaises en corniche avant de plonger dans la forêt pour un final technique. Pour les riders moins expérimentés, la descente du lac de Sainte-Croix vers Bauduen offre une introduction parfaite aux sentiers de la région.</p><h2>Logistique</h2><p>La base idéale est Castellane ou Moustiers-Sainte-Marie. Plusieurs loueurs de VTT à assistance électrique permettent aux débutants de profiter des mêmes sommets. Roulez en groupe et toujours avec un kit de réparation : les sentiers sont souvent isolés.</p>',
            ],

            [
                'title'       => 'Col du Galibier : 2 645 m au bout du pédalier',
                'slug'        => 'col-galibier-guide-cycliste',
                'category'    => 'destinations',
                'tags'        => $t('route', 'montagne', 'cyclosport'),
                'viewCount'   => 3870,
                'publishedAt' => $d('2024-08-10'),
                'excerpt'     => 'Le Galibier est le toit du Tour de France. Une montée pour les cyclistes qui veulent frôler les nuages et comprendre ce que ressentent les pros.',
                'content'     => '<p>À 2 645 mètres d\'altitude, le Col du Galibier est l\'un des cols les plus hauts et les plus beaux d\'Europe. Accessible depuis Valloire au nord ou depuis le Col du Lautaret au sud, il offre l\'une des expériences cyclistes les plus inoubliables des Alpes françaises.</p><h2>Versant nord depuis Valloire</h2><p>La montée depuis Valloire (18 km, 1 230 m D+) est la plus dure. Elle grimpe régulièrement à 6-7 % avec des passages plus raides avant le Plan Lachat. Les derniers kilomètres au-dessus du refuge récompensent l\'effort avec une vue incroyable sur les glaciers de la Meije.</p><h2>À savoir</h2><p>Le col est généralement ouvert de juin à octobre. En juillet, vous croiserez souvent des caravanes du Tour de France lors des étapes alpines. Emportez impérativement un coupe-vent et des gants même en été : la descente à 70 km/h avec une température de 5°C est une réalité.</p>',
            ],

            // TECHNIQUE ───────────────────────────────────────────────────────

            [
                'title'       => 'Choisir ses pneus Michelin pour le gravel : guide complet 2024',
                'slug'        => 'pneus-michelin-gravel-guide-2024',
                'category'    => 'technique',
                'tags'        => $t('pneus', 'michelin', 'gravel'),
                'viewCount'   => 5612,
                'publishedAt' => $d('2024-03-18'),
                'excerpt'     => 'Michelin propose plusieurs gammes de pneus gravel adaptés à tous les terrains. On décrypte les différences entre Power Gravel, Force XC et Pilot Sport CX pour vous aider à choisir.',
                'content'     => '<p>Le gravel est le segment qui cartonne depuis quelques années, et Michelin a su adapter son expertise pneumatique à cette discipline hybride. Mais entre la Power Gravel, la Force XC et les nouveautés 2024, difficile de s\'y retrouver. On fait le point.</p><h2>La Michelin Power Gravel</h2><p>C\'est le pneu polyvalent par excellence. Son dessin mixte avec des crampons centraux légers et des épaulements plus agressifs offre un bon compromis entre roulement sur route et accroche sur chemins. Disponible en 700×33c et 700×40c, il convient à la majorité des sorties gravel.</p><h2>La Michelin Force XC Competition</h2><p>Plus orientée XC et compétition, cette gomme sacrifie un peu de polyvalence au profit d\'un roulement exceptionnellement bas. Idéale pour les épreuves comme l\'Eroica ou les granfondos sur route blanche toscane.</p><h2>Quelle pression ?</h2><p>La règle d\'or sur gravel : descendez la pression par rapport à vos habitudes route. Entre 2 et 2,8 bar selon votre poids et le terrain. Un setup tubeless vous permettra de descendre encore plus bas sans risque de pincement.</p>',
            ],

            [
                'title'       => 'Maîtriser le freinage en descente : technique et sécurité',
                'slug'        => 'freinage-descente-technique-securite',
                'category'    => 'technique',
                'tags'        => $t('route', 'securite', 'debutant'),
                'viewCount'   => 2934,
                'publishedAt' => $d('2024-02-12'),
                'excerpt'     => 'Un mauvais freinage en descente est la première cause de chute chez les cyclistes. Voici les techniques pour descendre vite et en sécurité.',
                'content'     => '<p>La descente est souvent ce qui distingue les cyclistes confirmés des débutants. Inutile d\'avoir des jambes de professionnel si on perd 10 minutes dans chaque descente par excès de prudence ou, pire, si on chute par mauvaise technique de freinage.</p><h2>Les fondamentaux</h2><p><strong>Freinez avant le virage, jamais dedans.</strong> C\'est la règle numéro un. Réduire la vitesse en ligne droite, ouvrir la trajectoire, se pencher et sortir du virage en accélérant : voilà la mécanique d\'une descente efficace et sûre.</p><h2>Répartition du freinage</h2><p>Le frein avant est le plus puissant (il assure 70 % du freinage). Mais une utilisation brutale peut provoquer un endo (passage par-dessus le guidon). Apprenez à doser progressivement. Le frein arrière stabilise la trajectoire et doit être utilisé conjointement.</p><h2>Position du corps</h2><p>Descendez les talons, les genoux fléchis, les fesses légèrement en arrière de la selle. Cette position abaisse le centre de gravité et amortit les vibrations. Sur les longues descentes, sortez les mains des cocottes et posez-les sur le bas du cintre.</p>',
            ],

            [
                'title'       => 'Fitting vélo : comment trouver la bonne position en 6 étapes',
                'slug'        => 'fitting-velo-position-guide',
                'category'    => 'technique',
                'tags'        => $t('route', 'debutant', 'cyclosport'),
                'viewCount'   => 4102,
                'publishedAt' => $d('2024-01-25'),
                'excerpt'     => 'Une mauvaise position sur le vélo provoque douleurs et blessures. Le fitting est souvent négligé par les cyclistes. Voici les bases pour être bien assis dès le départ.',
                'content'     => '<p>Le fitting (ou ajustement postural) est la discipline qui consiste à adapter le vélo à la morphologie du cycliste. Un vélo mal réglé provoque des douleurs au dos, aux genoux, au cou et réduit l\'efficacité du pédalage. Quelques ajustements simples font toute la différence.</p><h2>1. La hauteur de selle</h2><p>C\'est le réglage le plus critique. La méthode simple : assis sur la selle, posez le talon sur la pédale en position basse. La jambe doit être quasi tendue. Avec l\'avant-pied, le genou sera légèrement fléchi à 25-35°.</p><h2>2. Le recul de selle</h2><p>Genou plié à 90° (pédale à 3 heures), le plateau de la rotule doit être aligné avec l\'axe de pédale. Avancez ou reculez la selle jusqu\'à trouver cet alignement.</p><h2>3. La hauteur du cintre</h2><p>Plus le cintre est bas, plus la position est aérodynamique mais contraignante pour le dos. Les débutants ont intérêt à démarrer avec un cintre à hauteur de selle et à le descendre progressivement.</p><h2>4. La longueur de potence</h2><p>Assis en position de pédalage, vos épaules ne doivent pas être crispées. Les bras légèrement fléchis absorbent les vibrations et évitent la fatigue cervicale.</p>',
            ],

            // VTT ─────────────────────────────────────────────────────────────

            [
                'title'       => 'Les Gets Bike Park : le meilleur bike park des Alpes ?',
                'slug'        => 'les-gets-bike-park-alpes',
                'category'    => 'vtt',
                'tags'        => $t('vtt', 'enduro', 'montagne'),
                'viewCount'   => 3480,
                'publishedAt' => $d('2024-06-28'),
                'excerpt'     => 'Chaque été, Les Gets se transforment en Mecque du VTT. Descentes toutes catégories, dirt park, enduro… Il y en a pour tous les niveaux.',
                'content'     => '<p>Situé en Haute-Savoie à 1 172 m d\'altitude, Les Gets est l\'une des stations de ski qui a le mieux réussi sa reconversion estivale grâce au VTT. Avec son bike park accessible en remontées mécaniques et ses 80 km de sentiers balisés, le site accueille chaque été des dizaines de milliers de riders venus du monde entier.</p><h2>Le bike park</h2><p>Le bike park des Gets propose une quarantaine de pistes allant du vert au noir. La piste Mégève, longue de 4 km avec 700 m de dénivelé, est une référence de la descente alpine. Pour les familles, la zone Yéti (pistes vertes et bleues) permet aux enfants de progresser en toute sécurité.</p><h2>Les sentiers enduro</h2><p>Au-delà du bike park, le massif du Mont Chéry offre des itinéraires enduro mémorables. La boucle des Combes (25 km, 900 m D+) enchaîne montées sous les alpages et descentes techniques dans la forêt. Le tout avec les télésièges pour revenir au départ.</p><h2>Infos pratiques</h2><p>Location de VTT full-suspension disponible sur place. La saison s\'étend de mi-juin à mi-septembre. Réservez vos forfaits remontées mécaniques en ligne pour éviter les files d\'attente.</p>',
            ],

            [
                'title'       => 'Choisir son premier VTT full-suspension : nos conseils',
                'slug'        => 'choisir-vtt-full-suspension-debutant',
                'category'    => 'vtt',
                'tags'        => $t('vtt', 'debutant'),
                'viewCount'   => 2760,
                'publishedAt' => $d('2024-04-05'),
                'excerpt'     => 'Full-sus ou hardtail ? 29 pouces ou 27,5 ? Carbon ou alu ? Le marché du VTT est complexe. Voici comment démêler les critères essentiels pour votre premier achat.',
                'content'     => '<p>L\'offre de VTT en 2024 est pléthorique et les choix techniques sont nombreux. Avant de vous perdre dans les comparatifs de composants, posons les bonnes questions.</p><h2>Full-sus ou hardtail ?</h2><p>Le hardtail (fourche suspendue uniquement) est plus léger, moins cher à entretenir et excellent pour développer la technique. Le full-suspension (suspension avant et arrière) est plus confortable sur terrain chahuté et pardonne mieux les erreurs. Pour débuter en trail et enduro, le full-sus s\'impose rapidement comme le choix le plus polyvalent.</p><h2>Quelle taille de roue ?</h2><p>Le 29 pouces roule plus vite en terrain roulant et passe mieux par-dessus les obstacles grâce à son angle d\'attaque plus favorable. Le 27,5 est plus agile et maniable, plébiscité en enduro. La majorité des constructeurs proposent désormais le 29 en taille standard.</p><h2>Quel budget ?</h2><p>En dessous de 1 500 €, méfiez-vous des full-sus d\'entrée de gamme : les suspensions de mauvaise qualité fatiguent et font moins bien le travail que sur un bon hardtail. Entre 2 000 € et 3 500 €, vous entrez dans une gamme où la valeur est excellente.</p>',
            ],

            // MOBILITÉ URBAINE ────────────────────────────────────────────────

            [
                'title'       => 'Commuter à vélo en ville : 10 règles pour survivre et arriver en forme',
                'slug'        => 'commuter-velo-ville-conseils',
                'category'    => 'mobilite-urbaine',
                'tags'        => $t('urbain', 'securite', 'debutant'),
                'viewCount'   => 6340,
                'publishedAt' => $d('2024-09-02'),
                'excerpt'     => 'De plus en plus de salariés font le choix du vélo pour aller au travail. On vous donne les 10 règles essentielles pour rouler en ville sans stress et en sécurité.',
                'content'     => '<p>En France, 60 % des trajets domicile-travail font moins de 10 km. Autrement dit, ils sont parfaitement adaptés au vélo. Pourtant, beaucoup hésitent encore à franchir le pas, souvent par crainte du trafic. Voici comment aborder le commuting à vélo sereinement.</p><h2>1. Planifiez votre itinéraire</h2><p>Utilisez Google Maps en mode vélo ou l\'application Géovélo pour trouver les itinéraires les plus sécurisés. La route la plus courte n\'est pas toujours la plus agréable ou la plus sûre.</p><h2>2. Soyez visibles</h2><p>Éclairage avant et arrière obligatoires de nuit, mais fortement recommandés en journée également. Un gilet réfléchissant ne gêne pas le pédalage et vous rend visible de loin.</p><h2>3. Anticipez les portières</h2><p>Le "dooring" (ouverture soudaine d\'une portière) est l\'un des accidents les plus fréquents en ville. Maintenez au moins 1,5 m de distance avec les voitures garées.</p><h2>4. Sécurisez votre vélo</h2><p>Un antivol de qualité (grade SRA ou équivalent) est indispensable. Attachez le cadre et la roue avant à un point fixe solide. Assurance vélo vivement conseillée.</p>',
            ],

            [
                'title'       => 'Vélo électrique en ville : est-ce vraiment une révolution ?',
                'slug'        => 'velo-electrique-ville-revolution',
                'category'    => 'mobilite-urbaine',
                'tags'        => $t('urbain', 'electrique', 'debutant'),
                'viewCount'   => 5180,
                'publishedAt' => $d('2024-10-14'),
                'excerpt'     => 'Les ventes de VAE (vélos à assistance électrique) ont explosé. Mais est-ce que ça change vraiment la pratique ? On teste et on vous dit tout.',
                'content'     => '<p>En 2023, plus d\'un million de VAE ont été vendus en France. C\'est désormais un vélo sur deux vendu. Pourtant, beaucoup de cyclistes "classiques" regardent encore l\'électrique avec méfiance. On fait le point sur ce que ça change vraiment.</p><h2>Les avantages concrets</h2><p>L\'assistance électrique efface les dénivelés, réduit la transpiration (crucial pour les trajets bureau) et permet de rouler plus vite sur de plus longues distances. Une étude européenne montre que les propriétaires de VAE roulent en moyenne 3 fois plus que les cyclistes classiques. L\'effet est donc très positif sur la pratique globale.</p><h2>Les limites</h2><p>Le poids (15-25 kg en moyenne) complique le transport dans les escaliers ou les espaces de rangement. La batterie a une autonomie de 40 à 120 km selon les modèles et les conditions. Et le prix : un bon VAE se négocie entre 1 500 € et 4 000 €.</p><h2>Moteur central ou moyeu ?</h2><p>Le moteur central (Bosch, Shimano Steps, Yamaha) offre une sensation de pédalage plus naturelle et une meilleure répartition des masses. Le moteur moyeu (intégré dans la roue) est plus discret et nécessite moins d\'entretien. Pour un usage urbain quotidien, les deux fonctionnent très bien.</p>',
            ],

            [
                'title'       => 'S\'équiper pour rouler sous la pluie : le guide complet',
                'slug'        => 'equipement-velo-pluie-guide',
                'category'    => 'mobilite-urbaine',
                'tags'        => $t('urbain', 'securite'),
                'viewCount'   => 3720,
                'publishedAt' => $d('2024-11-05'),
                'excerpt'     => 'La pluie ne doit pas être une excuse pour laisser le vélo au garage. Avec le bon équipement, rouler sous la pluie devient presque agréable.',
                'content'     => '<p>En France, il pleut en moyenne 100 à 150 jours par an selon les régions. Si vous voulez faire du vélo votre mode de déplacement principal, il va falloir apprendre à cohabiter avec la pluie. Bonne nouvelle : avec le bon équipement, c\'est tout à fait possible.</p><h2>La veste imperméable</html><p>C\'est l\'investissement numéro un. Recherchez un imperméable qui respire (membrane Gore-Tex ou équivalent) pour éviter l\'effet sauna. Les vestes cyclistes ont des coupes spécifiques : col remonté, dos allongé, poignets ajustables.</p><h2>Les garde-boue</h2><p>Indispensables si vous ne voulez pas arriver avec une zébrure de boue dans le dos. Optez pour des garde-boue à fixation rapide (type SKS Raceblade) pour les vélos sans œillets.</p><h2>Les chaussures</h2><p>Des chaussures imperméables ou des couvres-chaussures (overshoes) gardent les pieds au sec. Évitez les chaussures à coque carbone qui conduisent le froid par temps frais.</p><h2>Les gants</h2><p>Des gants imperméables sont essentiels dès que la température descend sous 15 °C. Des mains froides perdent en dextérité sur les leviers de frein, ce qui est dangereux.</p>',
            ],

            // ENTRAÎNEMENT ────────────────────────────────────────────────────

            [
                'title'       => 'Plan d\'entraînement 8 semaines pour réussir votre première cyclosportive',
                'slug'        => 'plan-entrainement-8-semaines-cyclosportive',
                'category'    => 'entrainement',
                'tags'        => $t('entrainement', 'cyclosport', 'route'),
                'viewCount'   => 7240,
                'publishedAt' => $d('2024-02-01'),
                'excerpt'     => 'Vous avez inscrit à une cyclosportive mais vous ne savez pas comment vous y préparer ? Ce plan sur 8 semaines vous emmène à la ligne de départ en forme.',
                'content'     => '<p>Une cyclosportive se prépare. Arriver à la ligne de départ sans préparation, c\'est risquer l\'abandon ou une expérience douloureuse. Ce plan sur 8 semaines est conçu pour les cyclistes ayant une base de 3 à 5 sorties par mois et visant un événement entre 100 et 180 km.</p><h2>Semaines 1-2 : construction de la base</h2><p>3 sorties par semaine. Deux sorties de 1h30 à allure modérée (zone 2, vous pouvez tenir une conversation) et une sortie longue de 2h30 à 3h. L\'objectif est d\'habituer l\'organisme au volume.</p><h2>Semaines 3-4 : introduction de l\'intensité</h2><p>Ajoutez sur une de vos sorties courtes des intervalles de 5 minutes en zone 4 (effort soutenu, conversation difficile). Commencez par 3 répétitions avec 5 minutes de récupération.</p><h2>Semaines 5-6 : pic de charge</h2><p>C\'est la phase la plus difficile. La sortie longue passe à 4-5h. Gérez bien votre ravitaillement : 60 à 90 g de glucides par heure d\'effort sont nécessaires au-delà de 2h.</p><h2>Semaines 7-8 : affûtage</h2><p>Réduisez le volume de 40 %. Maintenez quelques efforts intenses mais courts. Le corps récupère et "supercompense". Arrivez reposé le jour J.</p>',
            ],

            [
                'title'       => 'Sortie longue : comment gérer l\'effort sur 4 heures et plus',
                'slug'        => 'sortie-longue-gerer-effort',
                'category'    => 'entrainement',
                'tags'        => $t('route', 'cyclosport', 'entrainement'),
                'viewCount'   => 3910,
                'publishedAt' => $d('2024-03-08'),
                'excerpt'     => 'La sortie longue est le pilier de l\'entraînement cycliste. Mais beaucoup de riders partent trop vite et payent la note dans les dernières heures. Voici comment éviter le "mur".',
                'content'     => '<p>La sortie longue, c\'est souvent la sortie préférée des cyclistes. Mais elle est aussi celle qui réserve les mauvaises surprises si on la négocie mal. Voici les principes pour éviter de se retrouver en rade à 30 km de chez soi.</p><h2>Partez lentement, vraiment</h2><p>La règle d\'or : les 20 premiers % de la sortie doivent se faire à une allure qui vous semble "trop facile". C\'est le moyen de conserver du glycogène pour la fin. Les cyclosportifs expérimentés négatif-splittent : ils vont plus vite en deuxième moitié qu\'en première.</p><h2>Le ravitaillement</h2><p>À partir de 2h d\'effort, votre corps a besoin d\'apports glucidiques exogènes. Gels, barres, fruits secs, bananes : tout est bon. L\'objectif est d\'apporter 60 à 90 g de glucides par heure. Ne mangez pas selon votre faim mais selon l\'horloge : toutes les 30 à 45 minutes.</p><h2>L\'hydratation</h2><p>Buvez 500 à 750 ml par heure selon la chaleur et l\'intensité. Sur une sortie de 4h, vous pouvez perdre 2 à 3 litres de sueur. Incluez des électrolytes (sodium, magnésium) pour éviter les crampes.</p>',
            ],

            [
                'title'       => 'Nutrition à vélo : ce que la science dit vraiment',
                'slug'        => 'nutrition-velo-guide-science',
                'category'    => 'entrainement',
                'tags'        => $t('entrainement', 'cyclosport'),
                'viewCount'   => 4560,
                'publishedAt' => $d('2024-04-20'),
                'excerpt'     => 'Gels, barres, boissons isotoniques… Le marché de la nutrition sportive est envahi de produits. Qu\'est-ce qui fonctionne vraiment ? La science répond.',
                'content'     => '<p>La nutrition sportive est un domaine où le marketing dépasse souvent la réalité scientifique. On fait le tri entre les fondamentaux validés par la recherche et les gadgets inutiles.</p><h2>Avant l\'effort : les glucides</h2><p>Le glycogène musculaire est le carburant principal de l\'effort cycliste à haute intensité. Un repas riche en glucides (pâtes, riz, pain) 3 à 4h avant la sortie optimise ces réserves. Évitez les fibres et les graisses en excès qui ralentissent la digestion.</p><h2>Pendant l\'effort</h2><p>Au-delà de 75 minutes, l\'apport exogène en glucides devient nécessaire. Les études montrent qu\'un mélange glucose + fructose (ratio 2:1) permet d\'absorber jusqu\'à 90 g de glucides par heure contre 60 g pour le glucose seul. C\'est la raison pour laquelle les meilleurs gels et boissons utilisent ce mélange.</p><h2>La récupération</h2><p>La fenêtre métabolique post-effort (les 30 premières minutes) est le moment optimal pour recharger les réserves de glycogène et stimuler la synthèse protéique. Un ratio de 3:1 glucides/protéines est recommandé : un verre de lait chocolaté fait parfaitement l\'affaire.</p>',
            ],

            // COMPÉTITION ─────────────────────────────────────────────────────

            [
                'title'       => 'Tour de France 2024 : les 10 temps forts d\'une édition historique',
                'slug'        => 'tour-de-france-2024-temps-forts',
                'category'    => 'competition',
                'tags'        => $t('tour-de-france', 'pro', 'competition'),
                'viewCount'   => 12840,
                'publishedAt' => $d('2024-07-21'),
                'excerpt'     => 'L\'édition 2024 du Tour de France a tenu toutes ses promesses : attaques dans les Alpes, drama à Villeneuve-sur-Lot, domination slovène. Retour sur les moments qui ont marqué la Grande Boucle.',
                'content'     => '<p>Le Tour de France 2024 est passé à la postérité comme l\'une des éditions les plus spectaculaires de l\'ère moderne. Voici les 10 moments qui ont fait l\'histoire de cette Grande Boucle.</p><h2>1. Le départ à Florence</h2><p>Pour la première fois depuis 1998, le Tour partait d\'Italie. Le prologue dans les rues de la Renaissance et la première étape à travers le Chianti ont offert des images somptueuses, malgré la chaleur étouffante de l\'été toscan.</p><h2>2. La bascule dans les Alpes</h2><p>L\'étape reine avec l\'Iseran et le Galibier a sonné l\'heure de vérité. Les favoris se sont affrontés pour la première fois avec une intensité rarement vue dès la première semaine.</p><h2>3. L\'arrivée aux Champs-Élysées</h2><p>Le maillot jaune décroché au fil des étapes pyrénéennes et alpines s\'est confirmé au sprint final. Une victoire méritée après trois semaines d\'une domination collective exemplaire.</p>',
            ],

            [
                'title'       => 'Tadej Pogačar : anatomie d\'un champion hors normes',
                'slug'        => 'tadej-pogacar-anatomie-champion',
                'category'    => 'competition',
                'tags'        => $t('pro', 'tour-de-france'),
                'viewCount'   => 9450,
                'publishedAt' => $d('2024-08-02'),
                'excerpt'     => 'Vainqueur du Tour de France et de nombreuses classiques, Tadej Pogačar redéfinit ce qu\'un cycliste peut accomplir. Analyse de ce phénomène slovène.',
                'content'     => '<p>Il n\'a pas encore 30 ans et son palmarès ferait rougir des légendes du vélo. Tadej Pogačar est en train de réécrire l\'histoire du cyclisme professionnel avec une facilité déconcertante.</p><h2>Des qualités physiques exceptionnelles</h2><p>Son VO2 max, mesuré autour de 88 ml/min/kg, le place dans la même catégorie que les plus grands. Mais ce qui le distingue, c\'est sa capacité à répéter les efforts intenses sur plusieurs jours sans déclin apparent de ses performances. Sa récupération est phénoménale.</p><h2>Un coureur total</h2><p>Pogačar gagne sur les contre-la-montre, dans les cols, au sprint et dans les classiques. Une polyvalence qui rappelle Eddy Merckx. En 2024, il a réussi le doublé Giro-Tour, un exploit qui n\'avait plus été accompli depuis 1998.</p><h2>Un mental de feu</h2><p>Derrière la bonhomie affichée en conférence de presse, Pogačar est un compétiteur féroce. Ses attaques sont calculées, souvent placées dans les moments où ses adversaires sont au maximum de la souffrance.</p>',
            ],

            [
                'title'       => 'Paris-Roubaix : l\'Enfer du Nord, guide pour comprendre la classique',
                'slug'        => 'paris-roubaix-guide-classique',
                'category'    => 'competition',
                'tags'        => $t('pro', 'gravel', 'route'),
                'viewCount'   => 6720,
                'publishedAt' => $d('2024-04-08'),
                'excerpt'     => 'Paris-Roubaix est la course la plus brutale du calendrier. Pavés, boue, chutes spectaculaires… On vous explique ce qui fait de cette classique une course à part.',
                'content'     => '<p>Il existe des courses de vélo, et il existe Paris-Roubaix. La "Classique" (avec un grand C) se déroule chaque année en avril dans les Flandres françaises. Ses 30 secteurs pavés sur 260 km en font l\'épreuve la plus exigeante et la plus imprévisible du calendrier World Tour.</p><h2>Les pavés, vraiment ?</h2><p>Oui, de vrais pavés. Souvent humides, parfois enfouis sous la boue, les secteurs comme la Forêt d\'Arenberg (2,4 km à 5 étoiles), Mons-en-Pévèle ou le carrefour de l\'Arbre sont des épreuves en soi. Les chutes y sont violentes et les crevaisons fréquentes.</p><h2>Les pneus, arme secrète</h2><p>La préparation des vélos est cruciale. Les équipes utilisent des pneus de 28 à 30 mm gonflés à très basse pression (2 bar ou moins) pour absorber les chocs. Michelin fournit plusieurs équipes World Tour avec des pneus spécifiquement développés pour les pavés.</p><h2>L\'Arrivée au Vélodrome</h2><p>Le vainqueur de Paris-Roubaix entre seul dans le vélodrome de Roubaix devant 20 000 spectateurs en délire. Un moment d\'émotion unique dans le sport cycliste mondial.</p>',
            ],

            // ENTRETIEN ───────────────────────────────────────────────────────

            [
                'title'       => 'Changer sa chaîne de vélo : guide étape par étape',
                'slug'        => 'changer-chaine-velo-guide',
                'category'    => 'entretien',
                'tags'        => $t('mecanique', 'debutant'),
                'viewCount'   => 8930,
                'publishedAt' => $d('2024-01-10'),
                'excerpt'     => 'La chaîne est la pièce d\'usure numéro un du vélo. Une chaîne usée abîme les pignons et les plateaux. Voici comment la changer vous-même en 15 minutes.',
                'content'     => '<p>Une chaîne de vélo doit être remplacée avant qu\'elle ne soit trop étirée, au risque de voir les pignons et les plateaux s\'user prématurément. Ce guide vous explique comment faire ce remplacement essentiel.</p><h2>Quand changer la chaîne ?</h2><p>La règle des 2 000 km est un bon point de départ, mais l\'usure dépend de vos conditions de roulage. Investissez dans un vérificateur d\'usure de chaîne (moins de 10 €) : inséré entre deux maillons, il indique immédiatement si le remplacement est nécessaire (0,5 % = remplacer, 0,75 % = urgence).</p><h2>Le matériel nécessaire</h2><ul><li>Une chaîne neuve (adaptée au nombre de vitesses)</li><li>Un chasse-goupille ou une pince à maillons rapides</li><li>Un maillon rapide (généralement fourni avec la chaîne)</li></ul><h2>La procédure</h2><p>Retirez l\'ancienne chaîne en ouvrant le maillon rapide. Mesurez la nouvelle chaîne sur l\'ancienne pour couper à la bonne longueur. Enfilez la nouvelle chaîne dans le dérailleur arrière en suivant le chemin de l\'ancienne. Fermez avec le maillon rapide. Lubrifiez légèrement et essuyez l\'excédent.</p>',
            ],

            [
                'title'       => 'Régler ses freins hydrauliques : ne plus jamais souffrir',
                'slug'        => 'regler-freins-hydrauliques-guide',
                'category'    => 'entretien',
                'tags'        => $t('mecanique', 'securite'),
                'viewCount'   => 5420,
                'publishedAt' => $d('2024-02-28'),
                'excerpt'     => 'Les freins hydrauliques offrent une puissance et une modulation sans égal, mais ils demandent un entretien spécifique. On vous guide pas à pas.',
                'content'     => '<p>Les freins hydrauliques ont largement remplacé le câble sur les vélos modernes, VTT et route confondus. Leur puissance de freinage est incomparable, mais ils nécessitent quelques réglages et entretiens réguliers.</p><h2>Le réglage du point de friction</h2><p>Le levier doit mordre à une distance confortable de la main. La plupart des leviers hydrauliques (Shimano, SRAM, Magura) disposent d\'une vis de réglage qui permet d\'ajuster le point de contact sans intervenir sur le système.</p><h2>Régler l\'alignement des plaquettes</h2><p>Un frottement constant avec le disque indique que les plaquettes ne sont pas centrées sur le disque. Desserrez les vis du étrier, actionnez le levier et resserrez : l\'étrier se centre automatiquement sur le disque.</p><h2>La purge</h2><p>Si votre levier se ramollit ou devient spongieux, il est temps de purger le circuit (changer le liquide de frein). C\'est une opération à réaliser tous les 1-2 ans. Avec le kit de purge Shimano (25 €), c\'est faisable à la maison en 30 minutes.</p>',
            ],

            [
                'title'       => 'Hivernage du vélo : comment protéger son matériel en hors-saison',
                'slug'        => 'hivernage-velo-proteger-materiel',
                'category'    => 'entretien',
                'tags'        => $t('mecanique', 'route'),
                'viewCount'   => 4180,
                'publishedAt' => $d('2024-11-20'),
                'excerpt'     => 'L\'hiver est rude pour un vélo qui sort régulièrement. Sel, eau, boue : la corrosion guette. Voici les gestes essentiels pour passer l\'hiver sans abîmer votre monture.',
                'content'     => '<p>En hiver, les conditions de roulage (sel sur les routes, humidité, froid) accélèrent l\'usure de tous les composants du vélo. Quelques précautions simples permettent d\'allonger significativement la vie de votre matériel.</p><h2>Nettoyage après chaque sortie</h2><p>Le sel de voirie est l\'ennemi numéro un. Rincez votre vélo à l\'eau claire après chaque sortie par temps humide. Insistez sur la chaîne, les dérailleurs et les surfaces chromées. Séchez à l\'air comprimé ou avec un chiffon propre.</p><h2>Lubrification renforcée</h2><p>Utilisez un lubrifiant "temps humide" (lubrifiant mouillé) sur la chaîne en hiver. Plus épais, il tient mieux face à la pluie mais attire plus la saleté : nettoyez régulièrement.</p><h2>Protection de la transmission</h2><p>Un protège-cadre sur les haubans (là où frotte le dérailleur) et un protège-chaîne sur les bases évitent les rayures. La cire microcristalline appliquée sur le cadre repousse l\'eau et protège la peinture.</p><h2>Entreposage</h2><p>Stockez votre vélo dans un endroit sec (cave, garage). Évitez les variations de température importantes qui favorisent la condensation à l\'intérieur du cadre. Suspendez-le plutôt que de le laisser sur ses pneus qui se déforment à froid.</p>',
            ],

            [
                'title'       => 'Réparer une crevaison en 5 minutes : la méthode qui sauve les sorties',
                'slug'        => 'reparer-crevaison-5-minutes-methode',
                'category'    => 'entretien',
                'tags'        => $t('mecanique', 'pneus', 'michelin', 'debutant'),
                'viewCount'   => 11240,
                'publishedAt' => $d('2024-03-25'),
                'excerpt'     => 'Une crevaison au milieu d\'une sortie ne devrait jamais gâcher votre journée. Avec la bonne technique et le bon équipement, 5 minutes suffisent.',
                'content'     => '<p>La crevaison est le cauchemar du cycliste, mais elle fait partie du jeu. Savoir la gérer rapidement transforme un incident frustrant en simple arrêt technique. Voici la méthode pour changer une chambre à air en moins de 5 minutes.</p><h2>L\'équipement indispensable</h2><p>Ne partez jamais sans : une chambre à air de rechange (adaptée à votre taille de roue), un démonte-pneu (2 suffisent), une mini-pompe ou une cartouche CO2, et une pièce de monnaie pour trouver l\'objet responsable.</p><h2>La procédure</h2><ol><li>Retirez la roue (ouvrez les patins ou desserrez l\'étrier si freins disques)</li><li>Dégonflez complètement et retirez la valve</li><li>Insérez le démonte-pneu sous le talon du pneu et faites levier</li><li>Retirez l\'ancienne chambre</li><li>Passez votre main à l\'intérieur du pneu pour trouver l\'objet (épine, éclat de verre)</li><li>Gonflez légèrement la nouvelle chambre</li><li>Installez la chambre en commençant par la valve, remontez le pneu à la main</li><li>Gonflez et vérifiez que le pneu est bien emboîté</li></ol><p>Avec les pneus Michelin équipés de technologie ProTek, les crevaisons sont significativement moins fréquentes grâce aux protections intégrées.</p>',
            ],

            [
                'title'       => 'Régler son dérailleur arrière : fini la galère',
                'slug'        => 'regler-derailleur-arriere-guide',
                'category'    => 'entretien',
                'tags'        => $t('mecanique', 'debutant'),
                'viewCount'   => 6830,
                'publishedAt' => $d('2024-05-15'),
                'excerpt'     => 'Un dérailleur mal réglé saute ou grince sur tous les pignons. Avec méthode et patience, vous pouvez le régler vous-même avec un simple tournevis.',
                'content'     => '<p>Le réglage du dérailleur arrière est l\'opération de mécanique vélo qui fait le plus peur aux néophytes. Pourtant, avec la bonne méthode, c\'est à la portée de tous.</p><h2>Comprendre le problème</h2><p>Un dérailleur saute entre les pignons ou refuse de passer sur certains ? La cause est presque toujours la même : la tension du câble est mal réglée. Avant de toucher aux vis de butée (H et L), réglez la tension.</p><h2>Réglage de la tension du câble</h2><p>Passez en petite vitesse (grand pignon). Tournez le barillet (la molette de tension) dans le sens antihoraire pour augmenter la tension. Testez chaque passage de vitesse. Si la chaîne tarde à monter sur le grand pignon, augmentez encore la tension.</p><h2>Les vis de butée H et L</h2><p>Ces vis limitent la course du dérailleur. La vis H (haute) empêche la chaîne de tomber sur le plus petit pignon. La vis L (basse) l\'empêche de tomber dans les rayons. Une vis trop serrée empêche le passage sur le pignon extrême, une vis trop lâche risque de faire tomber la chaîne.</p><h2>Le B-screw</h2><p>Cette troisième vis ajuste la distance entre le galet supérieur et les pignons. En règle générale, 5 à 6 mm est la distance idéale.</p>',
            ],

        ];

        foreach ($articles as $data) {
            $article = (new Article())
                ->setTitle($data['title'])
                ->setSlug($data['slug'])
                ->setCategory($categories[$data['category']])
                ->setExcerpt($data['excerpt'])
                ->setContent($data['content'])
                ->setViewCount($data['viewCount'])
                ->setPublishedAt($data['publishedAt']);

            foreach ($data['tags'] as $tag) {
                $article->addTag($tag);
            }

            $manager->persist($article);
        }

        $manager->flush();
    }
}
