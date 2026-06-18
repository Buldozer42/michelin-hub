<?php

namespace App\Tests\Entity;

use App\Entity\Challenge;
use App\Entity\Objective;
use App\Enum\ObjectiveType;
use PHPUnit\Framework\TestCase;

class ObjectiveTest extends TestCase
{
    public function testDefaultValuesAreNull(): void
    {
        $objective = new Objective();

        $this->assertNull($objective->getId());
        $this->assertNull($objective->getType());
        $this->assertNull($objective->getValue());
        $this->assertNull($objective->getChallenge());
    }

    public function testSetAndGetType(): void
    {
        $objective = new Objective();

        $result = $objective->setType(ObjectiveType::DISTANCE);

        $this->assertSame(ObjectiveType::DISTANCE, $objective->getType());
        $this->assertSame($objective, $result);
    }

    public function testSetAndGetValue(): void
    {
        $objective = new Objective();

        $result = $objective->setValue(42.5);

        $this->assertSame(42.5, $objective->getValue());
        $this->assertSame($objective, $result);
    }

    public function testSetAndGetChallenge(): void
    {
        $objective = new Objective();
        $challenge = new Challenge();

        $result = $objective->setChallenge($challenge);

        $this->assertSame($challenge, $objective->getChallenge());
        $this->assertSame($objective, $result);
    }

    public function testSetChallengeAcceptsNull(): void
    {
        $objective = (new Objective())->setChallenge(new Challenge());

        $objective->setChallenge(null);

        $this->assertNull($objective->getChallenge());
    }

    public function testAllObjectiveTypesCanBeSet(): void
    {
        foreach (ObjectiveType::cases() as $type) {
            $objective = new Objective();
            $objective->setType($type);

            $this->assertSame($type, $objective->getType());
        }
    }
}
