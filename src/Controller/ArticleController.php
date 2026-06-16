<?php

namespace App\Controller;

use App\Repository\ArticleRepository;
use App\Repository\CategoryRepository;
use App\Repository\TagRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ArticleController extends AbstractController
{
    #[Route('/article', name: 'article_index')]
    public function index(
        ArticleRepository $articleRepository,
        CategoryRepository $categoryRepository,
        TagRepository $tagRepository,
    ): Response {
        return $this->render('article/index.html.twig', [
            'articles' => $articleRepository->findBy([], ['createdAt' => 'DESC']),
            'categories' => $categoryRepository->findAll(),
            'tags' => $tagRepository->findAll(),
        ]);
    }
}
