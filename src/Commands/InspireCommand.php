<?php
namespace App\Commands;

use App\Command;

class InspireCommand extends Command
{
    protected static $defaultName = 'inspire';
    protected static $defaultDescription = 'Display an inspiring quote';

    protected function execute($input, $output): int
    {
        $quotes = [
            'Simplicity is the ultimate sophistication.',
            'Make it work, make it right, make it fast.',
            'Code is like humor. When you have to explain it, it’s bad.',
        ];

        $this->line('');
        $this->line('  <comment>'.$quotes[array_rand($quotes)].'</comment>');
        $this->line('');

        return self::SUCCESS;
    }
}
