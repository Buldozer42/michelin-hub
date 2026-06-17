<?php

namespace App\Command;

use App\Entity\Article;
use App\Entity\Category;
use App\Entity\Tag;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:fixtures:load-bike-articles',
    description: 'Purges Article/Category/Tag tables and reloads ~20 cycling-themed demo articles.',
)]
class LoadBikeFixturesCommand extends Command
{
    private const CATEGORIES = [
        'Destinations' => 'Itinéraires et road trips à vélo, en France et ailleurs.',
        'Technique' => 'Réglages, choix du matériel et conseils techniques.',
        'VTT' => 'Tout-terrain, enduro et descente.',
        'Mobilité urbaine' => 'Vélotaf, sécurité et vie quotidienne en ville.',
        'Entraînement' => "Plans d'entraînement, nutrition et préparation physique.",
        'Compétition' => 'Course, performance et coulisses du peloton pro.',
        'Entretien' => 'Mécanique et entretien du vélo.',
    ];

    private const TAGS = [
        'vercors', 'route', 'itinéraire', 'pression', 'tubeless', 'setup', 'enduro', 'alpes',
        'test', 'vélotaf', 'pluie', 'sécurité', 'gravel', 'endurance', 'nutrition', 'compétition',
        'entretien', 'ville', 'performance', 'cyclotourisme', 'hiver', 'sprint', 'montagne',
        'échauffement', 'entraînement',
    ];

    private const ARTICLES = [
        [
            'title' => "L'échappée belle dans le Vercors",
            'category' => 'Destinations',
            'tags' => ['vercors', 'route', 'itinéraire'],
            'viewCount' => 3200,
            'publishedAgo' => '-65 days',
            'excerpt' => 'Entre falaises calcaires et routes suspendues, un itinéraire mythique pour tester votre endurance et vos pneus.',
            'content' => <<<HTML
                <p>Le Vercors n'est pas seulement un massif, c'est une promesse : celle d'un silence minéral, ponctué par le sifflement du vent sur les corniches. Cette boucle de 95 km, au départ de Villard-de-Lans, traverse des gorges suspendues qui donnent le vertige même assis sur sa selle.</p>
                <img src="https://picsum.photos/seed/vercors-route/900/500" alt="Route suspendue dans le Vercors" />
                <h2>Un dénivelé exigeant, une récompense totale</h2>
                <p>Comptez environ 1800 m de dénivelé positif. La montée du col de Rousset est longue mais régulière, idéale pour trouver son rythme. La descente, elle, récompense chaque coup de pédale avec une vue à couper le souffle sur le Diois.</p>
                <p>Emportez une coupe-vent : même en plein été, le plateau peut surprendre par sa fraîcheur en fin de journée.</p>
                HTML,
        ],
        [
            'title' => 'Optimiser sa pression de gonflage',
            'category' => 'Technique',
            'tags' => ['pression', 'tubeless', 'setup'],
            'viewCount' => 5800,
            'publishedAgo' => '-30 days',
            'excerpt' => "Comment trouver l'équilibre parfait entre confort et performance pure. Le guide complet.",
            'content' => <<<HTML
                <p>La pression de vos pneus est probablement le réglage le plus sous-estimé du cyclisme. Quelques dixièmes de bar peuvent transformer une sortie inconfortable en moment de pur plaisir.</p>
                <h2>La règle du pouce ne suffit plus</h2>
                <p>Avec la généralisation du tubeless, les plages de pression recommandées ont beaucoup baissé. Un cycliste de 75 kg roulant en 28 mm peut désormais descendre sous les 5 bars sans risquer le pincement.</p>
                <img src="https://picsum.photos/seed/pression-pneu/900/500" alt="Manomètre de gonflage sur une roue de vélo" />
                <p>Notre conseil : partez de l'abaque du fabricant, puis ajustez de 0,1 bar à la fois selon les sensations sur votre revêtement habituel.</p>
                HTML,
        ],
        [
            'title' => 'Wild Enduro : le test ultime',
            'category' => 'VTT',
            'tags' => ['enduro', 'alpes', 'test'],
            'viewCount' => 1900,
            'publishedAgo' => '-58 days',
            'excerpt' => 'Nous avons poussé les nouveaux pneus dans les sentiers les plus exigeants des Alpes. Résultat : une adhérence bluffante.',
            'content' => <<<HTML
                <p>Trois jours, douze descentes, et un objectif simple : faire craquer le nouveau pneu enduro dans les conditions les plus traîtres que les Alpes pouvaient nous offrir.</p>
                <video controls width="100%">
                    <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
                    Votre navigateur ne supporte pas la vidéo HTML5.
                </video>
                <h2>Boue, racines et plaques rocheuses</h2>
                <p>Sur les sentiers détrempés du Beaufortain, l'accroche en virage relevé a été le point fort unanime du groupe de test. Même chose sur les plaques rocheuses lisses où l'on craignait pourtant le dérapage.</p>
                <p>Verdict : un pneu qui inspire confiance, jusqu'à pousser les limites un peu plus loin que prévu à chaque sortie.</p>
                HTML,
        ],
        [
            'title' => 'Le vélotaf sous la pluie',
            'category' => 'Mobilité urbaine',
            'tags' => ['vélotaf', 'pluie', 'sécurité'],
            'viewCount' => 7400,
            'publishedAgo' => '-10 days',
            'excerpt' => 'Sécurité, équipement et choix de pneus pour rester au sec, en contrôle et à l\'heure lors de vos trajets urbains quotidiens.',
            'content' => <<<HTML
                <p>La pluie ne devrait jamais être une excuse pour laisser le vélo au garage. Avec le bon équipement, le vélotaf sous la pluie peut même devenir un moment paisible de la journée.</p>
                <img src="https://picsum.photos/seed/velotaf-pluie/900/500" alt="Cycliste urbain roulant sous la pluie" />
                <h2>Visibilité avant tout</h2>
                <p>Un éclairage avant et arrière puissant, des éléments rétroréfléchissants sur le sac et les chevilles : en ville, être vu compte autant que bien voir.</p>
                <p>Côté pneus, privilégiez une gomme plus tendre et une bande de roulement fine au centre pour limiter l'aquaplaning sur les pavés et les rails de tram.</p>
                HTML,
        ],
        [
            'title' => 'Préparer sa première sortie gravel',
            'category' => 'Technique',
            'tags' => ['gravel', 'setup', 'itinéraire'],
            'viewCount' => 2600,
            'publishedAgo' => '-45 days',
            'excerpt' => 'Du choix du vélo aux premiers chemins, tout ce qu\'il faut savoir pour se lancer sereinement dans le gravel.',
            'content' => <<<HTML
                <p>Le gravel a explosé ces dernières années, et pour cause : il offre une liberté que la route seule ne permet pas. Mais se lancer demande quelques ajustements.</p>
                <h2>Le bon pneu pour le bon terrain</h2>
                <p>Sur chemins roulants, un pneu de 38-40 mm avec une bande centrale lisse suffit largement. Pour des sentiers plus techniques, montez en largeur et en crampons sur les flancs.</p>
                <img src="https://picsum.photos/seed/gravel-debut/900/500" alt="Vélo gravel posé sur un chemin de terre" />
                <p>Pensez aussi à emporter une chambre à air de secours même en tubeless : sur gravel, les crevaisons par coupure restent possibles.</p>
                HTML,
        ],
        [
            'title' => "Structurer son plan d'entraînement hivernal",
            'category' => 'Entraînement',
            'tags' => ['entraînement', 'hiver', 'endurance'],
            'viewCount' => 4100,
            'publishedAgo' => '-90 days',
            'excerpt' => "L'hiver est la période idéale pour construire la base d'endurance qui fera la différence au printemps.",
            'content' => <<<HTML
                <p>Pas besoin de viser la performance en plein hiver : c'est la saison pour construire, patiemment, le moteur qui vous portera lors des beaux jours.</p>
                <h2>La base avant tout</h2>
                <p>Privilégiez de longues sorties à intensité modérée (zone 2), complétées par une à deux séances de home-trainer en intervalles courts pour entretenir le geste.</p>
                <img src="https://picsum.photos/seed/entrainement-hiver/900/500" alt="Cycliste s'entraînant sur home-trainer en hiver" />
                <p>Un plan hivernal réussi se mesure rarement en watts, mais en régularité : trois sorties par semaine valent mieux qu'une sortie héroïque isolée.</p>
                HTML,
        ],
        [
            'title' => "Dans les coulisses du Tour de France : le matériel des pros",
            'category' => 'Compétition',
            'tags' => ['compétition', 'performance', 'route'],
            'viewCount' => 9200,
            'publishedAgo' => '-15 days',
            'excerpt' => "Pneus, réglages et choix tactiques : plongée dans les coulisses techniques du peloton pendant le Tour.",
            'content' => <<<HTML
                <p>Derrière chaque étape du Tour de France se cache une mécanique de précision où chaque gramme et chaque dixième de bar compte.</p>
                <iframe width="100%" height="400" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Coulisses techniques du peloton" frameborder="0" allowfullscreen></iframe>
                <h2>Des choix de pneus à la minute près</h2>
                <p>Les équipes techniques ajustent la pression et le modèle de pneu jusqu'à la dernière minute avant le départ, en fonction de la météo et du profil du jour.</p>
                <p>Sur les étapes de montagne, certains coureurs choisissent même de changer de roues à mi-parcours pour optimiser la descente finale.</p>
                HTML,
        ],
        [
            'title' => 'Entretenir sa chaîne : le guide complet',
            'category' => 'Entretien',
            'tags' => ['entretien', 'setup'],
            'viewCount' => 6300,
            'publishedAgo' => '-22 days',
            'excerpt' => "Une chaîne bien entretenue, c'est un transfert de puissance optimal et une transmission qui dure deux fois plus longtemps.",
            'content' => <<<HTML
                <p>La chaîne est la pièce la plus sollicitée de votre vélo, et pourtant souvent la plus négligée. Quelques minutes d'entretien chaque semaine suffisent à prolonger sa durée de vie.</p>
                <h2>Nettoyer avant de lubrifier</h2>
                <p>Un dégraissant doux, un chiffon sec, et c'est reparti. Ne lubrifiez jamais une chaîne sale : vous ne feriez qu'enfermer les particules abrasives entre les maillons.</p>
                <img src="https://picsum.photos/seed/entretien-chaine/900/500" alt="Nettoyage d'une chaîne de vélo" />
                <p>Une goutte de lubrifiant par maillon, on essuie le surplus, et la transmission retrouve toute sa fluidité.</p>
                HTML,
        ],
        [
            'title' => 'Les cols mythiques des Alpes à vélo',
            'category' => 'Destinations',
            'tags' => ['alpes', 'montagne', 'cyclotourisme'],
            'viewCount' => 5400,
            'publishedAgo' => '-75 days',
            'excerpt' => "Galibier, Izoard, Alpe d'Huez : notre sélection des ascensions qui font vibrer tous les cyclistes.",
            'content' => <<<HTML
                <p>Certains noms résonnent comme des légendes pour tout cycliste : le Galibier, l'Izoard, l'Alpe d'Huez. Gravir ces cols, c'est marcher — ou plutôt rouler — sur les traces de l'histoire du cyclisme.</p>
                <img src="https://picsum.photos/seed/cols-alpes/900/500" alt="Route en lacets dans un col alpin" />
                <h2>Bien préparer sa logistique</h2>
                <p>En haute saison, partez tôt pour éviter la chaleur et le trafic des camping-cars. Emportez toujours une couche supplémentaire : la météo en altitude change vite.</p>
                <p>Chaque col a son propre caractère : régularité pour le Galibier, irrégularité brutale pour l'Izoard. De quoi composer un séjour complet.</p>
                HTML,
        ],
        [
            'title' => "Sprint final : la science de l'explosivité",
            'category' => 'Compétition',
            'tags' => ['sprint', 'performance', 'entraînement'],
            'viewCount' => 3800,
            'publishedAgo' => '-40 days',
            'excerpt' => "Travailler sa puissance maximale pour gagner les quelques secondes qui font la différence à l'arrivée.",
            'content' => <<<HTML
                <p>Le sprint final, c'est souvent quelques secondes qui décident d'une victoire. Mais cette explosivité ne s'improvise pas : elle se construit sur des semaines de travail spécifique.</p>
                <h2>Des séances courtes, mais intenses</h2>
                <p>Des répétitions de 10 à 15 secondes à intensité maximale, entrecoupées de longues récupérations, permettent de développer la puissance neuromusculaire propre au sprint.</p>
                <img src="https://picsum.photos/seed/sprint-velo/900/500" alt="Cycliste en plein effort de sprint" />
                <p>N'oubliez pas le placement : un bon sprinteur gagne souvent la course avant même le sprint, en se positionnant intelligemment dans les derniers kilomètres.</p>
                HTML,
        ],
        [
            'title' => 'VTT électrique : faut-il franchir le pas ?',
            'category' => 'VTT',
            'tags' => ['test', 'performance', 'montagne'],
            'viewCount' => 4700,
            'publishedAgo' => '-18 days',
            'excerpt' => "Plus lourd, mais redoutablement efficace en montée : on a testé un VTTAE sur trois semaines.",
            'content' => <<<HTML
                <p>Le VTT à assistance électrique divise encore les puristes, mais son efficacité en montée ne fait plus débat. Trois semaines de test pour se faire un avis tranché.</p>
                <video controls width="100%">
                    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">
                    Votre navigateur ne supporte pas la vidéo HTML5.
                </video>
                <h2>Un nouveau rapport à l'effort</h2>
                <p>L'assistance ne remplace pas l'effort, elle le redistribue : on grimpe plus, on descend plus, et la sortie type s'allonge naturellement.</p>
                <p>Seul vrai point faible constaté : le poids supplémentaire se fait sentir sur les portions techniques nécessitant de porter le vélo.</p>
                HTML,
        ],
        [
            'title' => '5 exercices pour renforcer son gainage à vélo',
            'category' => 'Entraînement',
            'tags' => ['entraînement', 'endurance', 'échauffement'],
            'viewCount' => 2300,
            'publishedAgo' => '-52 days',
            'excerpt' => "Un gainage solide améliore la posture, le rendement et limite les douleurs lombaires sur les longues sorties.",
            'content' => <<<HTML
                <p>Le gainage est souvent oublié des plans d'entraînement cyclistes, alors qu'il conditionne directement votre confort et votre rendement sur le vélo.</p>
                <h2>Cinq exercices simples à intégrer</h2>
                <p>Planche, gainage latéral, superman, pont fessier et mountain climbers : cinq exercices qui ciblent l'ensemble de la chaîne posturale en moins de 15 minutes.</p>
                <img src="https://picsum.photos/seed/gainage-velo/900/500" alt="Exercice de gainage au sol" />
                <p>Deux à trois séances par semaine suffisent pour observer une réelle différence sur la stabilité du bassin en fin de sortie longue.</p>
                HTML,
        ],
        [
            'title' => 'Rouler en ville : les équipements indispensables',
            'category' => 'Mobilité urbaine',
            'tags' => ['vélotaf', 'ville', 'sécurité'],
            'viewCount' => 5100,
            'publishedAgo' => '-8 days',
            'excerpt' => "Antivol, éclairage, sonnette : la liste des essentiels pour rouler sereinement au quotidien.",
            'content' => <<<HTML
                <p>Rouler en ville implique des contraintes différentes de la route ou du chemin : visibilité, sécurité du stationnement, et confort sur la durée.</p>
                <img src="https://picsum.photos/seed/equipement-ville/900/500" alt="Vélo urbain équipé pour la ville" />
                <h2>Le trio indispensable</h2>
                <p>Un antivol en U homologué, un éclairage avant/arrière à charge USB, et des garde-boue pour les jours de pluie : ce trio couvre 90% des besoins du cycliste urbain.</p>
                <p>Pensez également à une selle confortable adaptée à une position plus droite, typique des trajets courts et fréquents.</p>
                HTML,
        ],
        [
            'title' => 'Le gravel, la tendance qui redéfinit l\'aventure',
            'category' => 'Destinations',
            'tags' => ['gravel', 'cyclotourisme', 'itinéraire'],
            'viewCount' => 3600,
            'publishedAgo' => '-33 days',
            'excerpt' => "Entre route et VTT, le gravel ouvre un nouveau terrain de jeu pour les amoureux d'exploration.",
            'content' => <<<HTML
                <p>Ni tout à fait route, ni tout à fait VTT, le gravel s'est imposé comme la discipline de l'exploration par excellence, capable d'enchaîner bitume, chemins et sentiers en une seule sortie.</p>
                <h2>Tracer son propre itinéraire</h2>
                <p>C'est sans doute la plus grande force du gravel : la liberté de relier deux points par le chemin le plus intéressant, plutôt que le plus direct.</p>
                <img src="https://picsum.photos/seed/gravel-aventure/900/500" alt="Cycliste gravel sur un chemin forestier" />
                <p>Quelques applications de cartographie communautaire permettent aujourd'hui de dénicher des tracés inédits, loin des routes fréquentées.</p>
                HTML,
        ],
        [
            'title' => 'Nutrition du cycliste : que manger avant une sortie longue',
            'category' => 'Entraînement',
            'tags' => ['nutrition', 'endurance'],
            'viewCount' => 4900,
            'publishedAgo' => '-27 days',
            'excerpt' => "Bien charger ses réserves avant l'effort évite le coup de fatigue à mi-parcours.",
            'content' => <<<HTML
                <p>La sortie longue se prépare aussi dans l'assiette, dès la veille. Les réserves de glycogène constituées avant le départ conditionnent largement votre énergie disponible sur les dernières heures de selle.</p>
                <h2>La veille et le matin même</h2>
                <p>Privilégiez des glucides complexes la veille au soir (riz, pâtes, légumineuses), et un petit-déjeuner digeste le matin même : flocons d'avoine, banane, un peu de miel.</p>
                <img src="https://picsum.photos/seed/nutrition-velo/900/500" alt="Petit-déjeuner du cycliste avant une sortie" />
                <p>Pendant l'effort, visez 60 à 90 g de glucides par heure dès la deuxième heure de sortie pour éviter la fameuse fourchette.</p>
                HTML,
        ],
        [
            'title' => 'Réussir sa transition VTT vers la route',
            'category' => 'Technique',
            'tags' => ['setup', 'performance', 'test'],
            'viewCount' => 2100,
            'publishedAgo' => '-60 days',
            'excerpt' => "Passer du VTT à la route demande quelques ajustements de position et de matériel.",
            'content' => <<<HTML
                <p>Beaucoup de cyclistes découvrent le vélo par le VTT avant de vouloir explorer la route. La transition est naturelle, mais quelques ajustements facilitent grandement la prise en main.</p>
                <h2>Position et cintre</h2>
                <p>La position route est plus allongée et plus aérodynamique : prévoyez une période d'adaptation pour le dos et la nuque, surtout sur les sorties de plus de deux heures.</p>
                <img src="https://picsum.photos/seed/vtt-vers-route/900/500" alt="Vélo de route prêt pour une sortie" />
                <p>Côté pneus, on passe d'une logique d'adhérence tout-terrain à une logique de rendement : largeur réduite, pression plus élevée, gomme plus roulante.</p>
                HTML,
        ],
        [
            'title' => 'Les bases de la mécanique : réparer une crevaison',
            'category' => 'Entretien',
            'tags' => ['entretien', 'sécurité', 'setup'],
            'viewCount' => 8100,
            'publishedAgo' => '-5 days',
            'excerpt' => "Une compétence essentielle que tout cycliste devrait maîtriser, sur route comme en chemin.",
            'content' => <<<HTML
                <p>La crevaison reste l'incident le plus fréquent à vélo. Savoir la réparer rapidement, c'est l'assurance de ne jamais finir une sortie à pied.</p>
                <h2>Le matériel minimal à emporter</h2>
                <p>Une chambre à air de secours, deux démonte-pneus et une pompe ou une cartouche de CO2 : ce kit tient dans une trousse de selle et couvre 95% des cas.</p>
                <img src="https://picsum.photos/seed/crevaison-velo/900/500" alt="Réparation d'une crevaison sur le bord de la route" />
                <p>Pensez à vérifier l'intérieur du pneu avant de remonter la nouvelle chambre : un petit éclat de verre oublié, et la crevaison se reproduit immédiatement.</p>
                HTML,
        ],
        [
            'title' => 'Compétition amateur : se lancer en cyclisme sur route',
            'category' => 'Compétition',
            'tags' => ['compétition', 'route', 'performance'],
            'viewCount' => 1700,
            'publishedAgo' => '-48 days',
            'excerpt' => "Licence, premières courses et erreurs à éviter : le guide pour débuter la compétition sur route.",
            'content' => <<<HTML
                <p>Passer de la pratique loisir à la première course officielle peut sembler intimidant. Voici les étapes clés pour se lancer sans se brûler les ailes.</p>
                <h2>Commencer par les bonnes catégories</h2>
                <p>Les clubs proposent souvent des courses d'initiation adaptées aux profils débutants : c'est l'occasion idéale de découvrir le peloton sans se mettre une pression inutile.</p>
                <img src="https://picsum.photos/seed/competition-route/900/500" alt="Peloton de cyclistes amateurs en course" />
                <p>L'erreur la plus commune ? Vouloir tout donner dès les premiers kilomètres. La gestion d'effort s'apprend course après course.</p>
                HTML,
        ],
        [
            'title' => 'Cyclotourisme en famille : nos meilleurs itinéraires',
            'category' => 'Destinations',
            'tags' => ['cyclotourisme', 'itinéraire', 'ville'],
            'viewCount' => 3300,
            'publishedAgo' => '-70 days',
            'excerpt' => "Des voies vertes sécurisées aux étapes courtes : comment organiser un séjour à vélo avec des enfants.",
            'content' => <<<HTML
                <p>Le cyclotourisme en famille n'a rien à voir avec une cyclosportive : l'objectif est le plaisir partagé, à un rythme adapté à chacun.</p>
                <h2>Privilégier les voies vertes</h2>
                <p>Les anciennes voies ferrées reconverties en pistes cyclables offrent un profil plat et sécurisé, parfait pour les enfants à vélo ou en remorque.</p>
                <img src="https://picsum.photos/seed/famille-velo/900/500" alt="Famille à vélo sur une voie verte" />
                <p>Comptez des étapes de 20 à 30 km maximum par jour avec de jeunes enfants, en prévoyant de vraies pauses ludiques en chemin.</p>
                HTML,
        ],
        [
            'title' => 'Bien choisir ses pneus selon la saison',
            'category' => 'Technique',
            'tags' => ['pression', 'tubeless', 'hiver'],
            'viewCount' => 4400,
            'publishedAgo' => '-12 days',
            'excerpt' => "Un pneu adapté à la saison change radicalement votre niveau de confiance sur la route.",
            'content' => <<<HTML
                <p>Toutes les gommes ne se comportent pas de la même façon selon la température et l'humidité. Adapter son choix de pneu à la saison est un réflexe trop souvent négligé.</p>
                <h2>Hiver : priorité à l'adhérence</h2>
                <p>En dessous de 10°C, une gomme plus tendre conserve sa souplesse et donc son grip, même si elle s'use un peu plus vite.</p>
                <img src="https://picsum.photos/seed/pneus-saison/900/500" alt="Pneu de vélo sur route mouillée en hiver" />
                <p>En été, une gomme plus dure et une pression légèrement supérieure optimisent le rendement sur revêtement sec et chaud.</p>
                HTML,
        ],
    ];

    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $this->entityManager->getConnection()->executeStatement(
            'TRUNCATE TABLE article_tag, article, category, tag RESTART IDENTITY CASCADE'
        );

        $categories = [];
        foreach (self::CATEGORIES as $name => $description) {
            $category = new Category();
            $category->setName($name);
            $category->setSlug($this->slugify($name));
            $category->setDescription($description);
            $this->entityManager->persist($category);
            $categories[$name] = $category;
        }

        $tags = [];
        foreach (self::TAGS as $name) {
            $tag = new Tag();
            $tag->setName($name);
            $tag->setSlug($this->slugify($name));
            $this->entityManager->persist($tag);
            $tags[$name] = $tag;
        }

        $now = new \DateTimeImmutable();
        foreach (self::ARTICLES as $index => $data) {
            $article = new Article();
            $article->setTitle($data['title']);
            $article->setSlug($this->slugify($data['title']));
            $article->setExcerpt($data['excerpt']);
            $article->setContent($data['content']);
            $article->setCoverImage(sprintf('https://picsum.photos/seed/cover-%d/900/500', $index));
            $article->setViewCount($data['viewCount']);
            $article->setPublishedAt($now->modify($data['publishedAgo']));
            $article->setCategory($categories[$data['category']]);

            foreach ($data['tags'] as $tagName) {
                $article->addTag($tags[$tagName]);
            }

            $this->entityManager->persist($article);
        }

        $this->entityManager->flush();

        $io->success(sprintf(
            'Loaded %d categories, %d tags and %d articles.',
            count($categories),
            count($tags),
            count(self::ARTICLES)
        ));

        return Command::SUCCESS;
    }

    private function slugify(string $value): string
    {
        $slug = strtolower($value);
        $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT', $slug);
        $slug = $transliterated !== false ? $transliterated : $slug;
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? $slug;

        return trim($slug, '-');
    }
}
