<?php
namespace Deployer;

require 'recipe/laravel.php';

set('repository', 'git@github-bluebixt:Blue-Cannon/Gitto.git');
set('branch', 'master');

localhost('local')
    ->set('deploy_path', __DIR__ . '/.dep/local');

after('deploy:failed', 'deploy:unlock');
