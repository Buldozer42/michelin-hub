<?php

namespace App\Enum;

enum ObjectiveType : string {
    case DISTANCE = "distance";
    case ELEVATION = "elevation";
    case FREQUENCY = "frenquency";
    case DURATION = "duration";
}