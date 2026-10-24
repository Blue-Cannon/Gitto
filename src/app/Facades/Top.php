<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static \Illuminate\Foundation\Console\ClosureCommand command(string $signature, \Closure $callback)
 */
class Top extends Facade
{
    protected static function getFacadeAccessor()
    {
        return \Illuminate\Contracts\Console\Kernel::class;
    }
}
