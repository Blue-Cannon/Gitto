<?php
namespace App;

use Symfony\Component\Console\Command\Command as BaseCommand;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

abstract class Command extends BaseCommand
{
    protected SymfonyStyle $io;

    protected function initialize(InputInterface $input, OutputInterface $output): void
    {
        $this->io = new SymfonyStyle($input, $output);
    }

    protected function info(string $msg): void { $this->io->success($msg); }
    protected function error(string $msg): void { $this->io->error($msg); }
    protected function line(string $msg): void { $this->io->writeln($msg); }
}
