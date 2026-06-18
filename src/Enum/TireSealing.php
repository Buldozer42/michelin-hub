<?php

namespace App\Enum;

enum TireSealing: string
{
    case TUBE_TYPE = 'tube_type';
    case TUBELESS_READY = 'tubeless_ready';
    case TUBULAR = 'tubular';
}
