<?php
namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use App\Controller\Security\LoginController;
use App\Controller\Security\RegisterController;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;

#[ApiResource(operations: [
    new Post(
        uriTemplate: '/login',
        controller: LoginController::class,
        read: false,
        output: false,
        openapi: new Operation(
            summary: 'Login user and return JWT token',
            requestBody: new RequestBody(
                content: new \ArrayObject([
                    'application/json' => [
                        'example' => [
                            'login' => 'bsapp@mail.com',
                            'password' => 'PassW0rd123456789!',
                        ],
                      'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'login' => ['type' => 'string'],
                                'password' => ['type' => 'string'],
                            ],
                            'required' => ['login', 'password'],
                        ],
                    ],
                ]),
                required: true,
            ),
        ),

    ),
    new Post(
        uriTemplate: '/register',
        controller: RegisterController::class,
        read: false,
        output: false,
        openapi: new Operation(
            summary: 'Register new user',
            requestBody: new RequestBody(
                content: new \ArrayObject([
                    'application/json' => [
                        'example' => [
                            'lastName' => 'SAPP',
                            'firstName' => 'Bob',
                            'email' => 'bsapp@mail.com',
                            'username' => 'bsapp',
                            'password' => 'PassW0rd123456789!',
                        ],
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'lastName' => ['type' => 'string'],
                                'firstName' => ['type' => 'string'],
                                'email' => ['type' => 'string'],
                                'username' => ['type' => 'string'],
                                'password' => ['type' => 'string'],
                            ],
                            'required' => ['lastName', 'firstName', 'email', 'username', 'password'],
                        ],
                    ],
                ]),
                required: true,
            ),
        ),

    )
])]
class Security
{}