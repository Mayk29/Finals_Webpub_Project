<?php
// Copy this file to config.php and fill in the values.
// config.php is git-ignored so credentials never reach the repository.
return [
    // 'mysql' on AwardSpace. 'sqlite' is only for testing on your own computer.
    'driver'      => 'mysql',

    // MySQL details from AwardSpace > Databases (host is usually "localhost").
    'host'        => 'localhost',
    'name'        => 'DATABASE_NAME',
    'user'        => 'DATABASE_USER',
    'pass'        => 'DATABASE_PASSWORD',

    // Added in front of every table name, so this site can share a database
    // with another one (AwardSpace free allows only one database).
    'prefix'      => 'papaj_',

    // Only used when driver is 'sqlite'.
    'sqlite_path' => __DIR__ . '/papaj.sqlite',

    // Needed to add/edit/delete products and delete customers through the API
    // (send it as the X-Admin-Key header). Leave empty to disable those calls.
    'admin_key'   => '',
];
