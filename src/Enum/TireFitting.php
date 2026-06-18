<?php

namespace App\Enum;

/** Wheel position(s) this tire model is designed for (product spec). Distinct from TirePosition which records where it is physically installed. */
enum TireFitting: string
{
    case FRONT = 'front';
    case REAR = 'rear';
    case FRONT_REAR = 'front_rear';
}
