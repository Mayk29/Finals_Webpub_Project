<?php
declare(strict_types=1);

// Never leak PHP/SQL details (paths, credentials) to visitors.
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e) {
    error_log('[papaj-api] ' . $e->getMessage());
    fail(500, 'Server error. Please try again later.');
});

function cfg(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) {
            fail(500, 'Server is not configured: api/config.php is missing.');
        }
        $config = require $file;
    }
    return $config;
}

// Table name with the optional prefix from config.php (keeps our tables apart
// from other sites sharing the same database).
function t(string $name): string
{
    $prefix = (string) (cfg()['prefix'] ?? '');
    return preg_replace('/[^A-Za-z0-9_]/', '', $prefix) . $name;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $c = cfg();
    try {
        if (($c['driver'] ?? 'mysql') === 'sqlite') {
            $pdo = new PDO('sqlite:' . $c['sqlite_path']);
        } else {
            $pdo = new PDO(
                "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4",
                $c['user'],
                $c['pass']
            );
        }
    } catch (PDOException $e) {
        fail(500, 'Could not connect to the database. Check api/config.php.');
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    install_if_needed($pdo, $c['driver'] ?? 'mysql');
    return $pdo;
}

// Creates the tables and starter data the first time the API is used.
function install_if_needed(PDO $pdo, string $driver): void
{
    try {
        $pdo->query('SELECT 1 FROM ' . t('products') . ' LIMIT 1');
        return;
    } catch (PDOException $e) {
        // Tables do not exist yet - create them below.
    }

    $id = $driver === 'sqlite'
        ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
        : 'INT AUTO_INCREMENT PRIMARY KEY';
    $tail = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $p = t('');

    $pdo->exec("CREATE TABLE IF NOT EXISTS {$p}products (
        id $id,
        image VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        price DOUBLE NOT NULL,
        description VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL
    )$tail");

    $pdo->exec("CREATE TABLE IF NOT EXISTS {$p}customers (
        id $id,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        location VARCHAR(255) NOT NULL,
        occupation VARCHAR(255) NOT NULL
    )$tail");

    $pdo->exec("CREATE TABLE IF NOT EXISTS {$p}users (
        id $id,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        age VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        occupation VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )$tail");

    $pdo->exec("CREATE TABLE IF NOT EXISTS {$p}contacts (
        id $id,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        contact VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )$tail");

    seed($pdo);
}

function seed(PDO $pdo): void
{
    $products = [
        ['images/menu_2.jpg', 'Beef set', 329, 'Beef meat set with all sides', 'meat'],
        ['images/menu_1.jpg', 'Pork belly and Beef set', 299, 'Pork and Beef meat set with all sides', 'meat'],
        ['images/menu_3.jpg', 'Pork Belly set', 229, 'Pork Belly meat set with all sides', 'meat'],
        ['images/menu_6.jpg', 'Pork Jowl', 130, 'Pork Jowl 500g', 'meat'],
        ['images/menu_7.jpg', 'Pork Belly', 168, 'Pork Belly 500g', 'meat'],
        ['images/menu_8.jpg', 'Beef', 188, 'Beef 500g', 'meat'],
        ['images/menu_9.jpg', 'Lettuce', 50, 'Fresh Lettuce', 'dips-vege'],
        ['images/menu_10.jpg', 'Samgy Paste', 65, 'Single serving of Samgy Paste', 'dips-vege'],
        ['images/menu_10.jpg', 'Samgy Cheese', 50, 'Single serving of Samgy Cheese', 'dips-vege'],
        ['images/menu_11.jpg', 'Kimchi', 85, 'Single serving of Kimchi', 'sides'],
        ['images/menu_12.jpg', 'Potato Marbles', 100, 'Single serving of Potato Marbles', 'sides'],
        ['images/menu_13.jpg', 'Japchae', 100, 'Single serving of Japchae', 'sides'],
        ['images/menu_14.jpg', 'Egg Roll', 120, 'Single serving of Egg roll', 'sides'],
        ['images/menu_15.jpg', 'Glazed Kamote', 75, 'Single serving of Glazed Kamote', 'sides'],
        ['images/menu_16.jpg', 'Macaroni Salad', 100, 'Single serving of Macaroni Salad', 'sides'],
        ['images/menu_17.jpg', 'Kimbap', 120, 'Single serving of Kimbap', 'sides'],
        ['images/menu_18.jpg', 'Fish Cake', 120, 'Single serving of Fish Cake', 'sides'],
        ['images/menu_19.jpg', 'Tteokbokki', 120, 'Single serving of Tteokbokki', 'sides'],
    ];
    $stmt = $pdo->prepare('INSERT INTO ' . t('products') . ' (image, title, price, description, category) VALUES (?, ?, ?, ?, ?)');
    foreach ($products as $p) {
        $stmt->execute($p);
    }

    $customers = [
        ['Michael Ronquillo', 'ronquillomichaelarnold@gmail.com', 21, 'Porac', 'Student'],
        ['Luiz David', 'ldavid@gmail.com', 32, 'San Fernado', 'Teacher'],
        ['Diana David', 'ddavid@gmail.com', 31, 'Mabalacat', 'Teacher'],
        ['Benedict Ayson', 'bayson@gmail.com', 19, 'San Fernando', 'Student'],
        ['Princess Dimalanta', 'pdimalanta@gmail.com', 18, 'San Fernando', 'Student'],
        ['Ruel Sanchez', 'rsanchez@gmail.com', 29, 'Angeles', 'Call Center'],
        ['Katherine Lopez', 'klopez@gmail.com', 28, 'Angeles', 'Call Center'],
        ['Matthew Guinto', 'mguinto@gmail.com', 30, 'Angeles', 'Call Center'],
        ['Paul Magsaysay', 'pmagsaysay@gmail.com', 40, 'San Fernando', 'Nurse'],
        ['Melissa Gonong', 'mgonong@gmail.com', 39, 'San Fernando', 'Nurse'],
        ['Rafael Estacio', 'restacio@gmail.com', 50, 'San Fernando', 'Vendor'],
        ['Bea De Guzman', 'bdeguzman@gmail.com', 53, 'San Fernando', 'None'],
    ];
    $stmt = $pdo->prepare('INSERT INTO ' . t('customers') . ' (name, email, age, location, occupation) VALUES (?, ?, ?, ?, ?)');
    foreach ($customers as $c) {
        $stmt->execute($c);
    }
}

function respond($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message): void
{
    respond(['error' => $message], $status);
}

// Form posts and JSON bodies are both accepted.
function input(): array
{
    if (!empty($_POST)) {
        return $_POST;
    }
    $json = json_decode((string) file_get_contents('php://input'), true);
    return is_array($json) ? $json : [];
}

function text(array $in, string $key, int $max = 255): string
{
    $value = trim((string) ($in[$key] ?? ''));
    if ($value === '') {
        fail(422, "Field '$key' is required.");
    }
    $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    if ($length > $max) {
        fail(422, "Field '$key' is too long.");
    }
    return $value;
}

function valid_email(string $email): string
{
    $email = strtolower($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail(422, 'Please enter a valid email address.');
    }
    return $email;
}

// Whole numbers come back as ints, so the pages can compare ids strictly.
function num($value)
{
    $n = $value + 0;
    return (is_float($n) && floor($n) === $n) ? (int) $n : $n;
}

function product_out(array $r): array
{
    return [
        'id'       => (int) $r['id'],
        'image'    => $r['image'],
        'title'    => $r['title'],
        'price'    => num($r['price']),
        'desc'     => $r['description'],
        'category' => $r['category'],
        'rating'   => isset($r['rating']) ? round((float) $r['rating'], 1) : 0,
        'votes'    => (int) ($r['votes'] ?? 0),
    ];
}

function customer_out(array $r): array
{
    return [
        'id'         => (int) $r['id'],
        'name'       => $r['name'],
        'email'      => $r['email'],
        'age'        => (int) $r['age'],
        'location'   => $r['location'],
        'occupation' => $r['occupation'],
    ];
}

function all_customers(): array
{
    return array_map('customer_out', db()->query('SELECT * FROM ' . t('customers') . ' ORDER BY id')->fetchAll());
}

function require_admin(): void
{
    $key = (string) (cfg()['admin_key'] ?? '');
    $sent = (string) ($_SERVER['HTTP_X_ADMIN_KEY'] ?? '');
    if ($key === '' || !hash_equals($key, $sent)) {
        fail(403, 'Admin key required.');
    }
}

// The orders table is created the first time it is needed, so a database that was
// installed before checkout existed picks it up without a manual step.
function ensure_orders_table(PDO $pdo): void
{
    $driver = cfg()['driver'] ?? 'mysql';
    $id = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
    $tail = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $pdo->exec('CREATE TABLE IF NOT EXISTS ' . t('orders') . " (
        id $id,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(50) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        address VARCHAR(500) NOT NULL,
        notes VARCHAR(500) NOT NULL,
        items TEXT NOT NULL,
        total DOUBLE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )$tail");
}

// Ratings of the products from past customers: average rating and number of reviews. The table is created on first
// use and every product that has no row yet gets its starting rating (new products start with no reviews).
function ensure_ratings_table(PDO $pdo): void
{
    $driver = cfg()['driver'] ?? 'mysql';
    $tail = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $pdo->exec('CREATE TABLE IF NOT EXISTS ' . t('product_ratings') . " (
        product_id INT NOT NULL PRIMARY KEY,
        rating DOUBLE NOT NULL,
        votes INT NOT NULL
    )$tail");

    $missing = $pdo->query('SELECT id, title FROM ' . t('products') . ' WHERE id NOT IN (SELECT product_id FROM ' . t('product_ratings') . ')')->fetchAll();
    if (!$missing) {
        return;
    }
    $starting = [
        'Beef set' => [4.9, 86], 'Pork belly and Beef set' => [4.8, 102], 'Pork Belly set' => [4.7, 74],
        'Pork Jowl' => [4.6, 41], 'Pork Belly' => [4.8, 58], 'Beef' => [4.7, 49],
        'Lettuce' => [4.3, 22], 'Samgy Paste' => [4.5, 35], 'Samgy Cheese' => [4.6, 44],
        'Kimchi' => [4.4, 61], 'Potato Marbles' => [4.5, 38], 'Japchae' => [4.6, 47],
        'Egg Roll' => [4.7, 52], 'Glazed Kamote' => [4.4, 29], 'Macaroni Salad' => [4.3, 31],
        'Kimbap' => [4.6, 45], 'Fish Cake' => [4.5, 40], 'Tteokbokki' => [4.8, 63],
    ];
    $insert = $pdo->prepare('INSERT INTO ' . t('product_ratings') . ' (product_id, rating, votes) VALUES (?, ?, ?)');
    foreach ($missing as $m) {
        $r = $starting[$m['title']] ?? [0, 0];
        $insert->execute([(int) $m['id'], $r[0], $r[1]]);
    }
}

// Order status (pending / completed / cancelled) and the ratings customers leave for completed orders.
// Old databases get the status column added the first time it is needed.
function ensure_order_extras(PDO $pdo): void
{
    ensure_orders_table($pdo);
    try {
        $pdo->query('SELECT status FROM ' . t('orders') . ' LIMIT 1');
    } catch (PDOException $e) {
        $pdo->exec('ALTER TABLE ' . t('orders') . " ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'");
    }
    $driver = cfg()['driver'] ?? 'mysql';
    $tail = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $pdo->exec('CREATE TABLE IF NOT EXISTS ' . t('order_ratings') . " (
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        rating INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (order_id, product_id)
    )$tail");
}

// Contact numbers are compared by their digits only, so "0917 123-4567" and "09171234567" match.
function digits(string $value): string
{
    return preg_replace('/\D+/', '', $value);
}

function contact_sql(): string
{
    return "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(contact, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '')";
}
