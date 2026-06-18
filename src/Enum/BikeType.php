<?php

namespace App\Enum;

enum BikeType: string
{
    case ROAD = 'road';
    case MOUNTAIN = 'mountain';
    case GRAVEL = 'gravel';
    case URBAN = 'urban';
    case ELECTRIC = 'electric';
    case BMX = 'bmx';
    case TRIATHLON = 'triathlon';
}
