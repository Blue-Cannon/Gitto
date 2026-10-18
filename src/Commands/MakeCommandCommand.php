<?php
namespace App\Commands;

use App\Command;
use Symfony\Component\Console\Input\InputArgument;

class MakeCommandCommand extends Command
{
    protected static $defaultName = 'make:command';
    protected static $defaultDescription = 'Create a new Artisan command';

    protected function configure(): void
    {
        $this->addArgument('name', InputArgument::REQUIRED, 'Command class name, e.g. SendMail');
    }

    protected function execute($input, $output): int
    {
        $name = $input->getArgument('name');
        $class = str_ends_with($name, 'Command') ? $name : $name.'Command';
        $commandName = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', str_replace('Command','',$class)));
        $commandName = trim($commandName, '-');

        $path = __DIR__ . "/$class.php";
        
        if (file_exists($path)) {
            $this->error("$class already exists!");
            return self::FAILURE;
        }

        $stub = <<<PHP
<?php
namespace App\Commands;

use App\Command;

class $class extends Command
{
    protected static \$defaultName = '$commandName';
    protected static \$defaultDescription = 'Description for $commandName';

    protected function execute(\$input, \$output): int
    {
        \$this->info('Running $commandName...');

        // \$this->io->ask('Question?');
        // \$this->line('Hello');

        return self::SUCCESS;
    }
}
PHP;

        file_put_contents($path, $stub);
        $this->info("Command App\\Commands\\$class created!");
        $this->line("Path: src/Commands/$class.php");

        return self::SUCCESS;
    }
}
