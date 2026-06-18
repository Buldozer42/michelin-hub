<?php

namespace App\CustomException;

final class ActivitySyncException extends \RuntimeException
{
	/**
	 * @param array<string,mixed> $context
	 */
	public function __construct(
		string $message,
		private readonly int $statusCode,
		private readonly array $context = [],
	) {
		parent::__construct($message);
	}

	public function getStatusCode(): int
	{
		return $this->statusCode;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function getContext(): array
	{
		return $this->context;
	}
}