<?php
namespace App;

use Symfony\Component\Console\Application as BaseApp;

class Application extends BaseApp
{
    public function __construct()
    {
        parent::__construct('DevCLT', '1.0.0');

        // Auto-load every file in src/Commands
        foreach (glob(__DIR__.'/Commands/*.php') as $file) {
            $class = 'App\\Commands\\' . basename($file, '.php');
            if (class_exists($class)) {
                $this->add(new $class());
            }
        }
    }
}
