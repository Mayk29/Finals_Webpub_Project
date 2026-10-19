<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
// Some hosts block PUT/DELETE; allow them to be tunnelled through POST.
if ($method === 'POST' && !empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
}

$route = $_GET['route'] ?? ltrim($_SERVER['PATH_INFO'] ?? '', '/');
$parts = array_values(array_filter(explode('/', trim($route, '/')), 'strlen'));
$resource = $parts[0] ?? '';
$id = isset($parts[1]) && ctype_digit($parts[1]) ? (int) $parts[1] : null;

switch ($resource) {
    // ---------------------------------------------------------------- customers
    case 'customers':
        if ($method === 'GET' && count($parts) === 1) {
            respond(all_customers());
        }
        if ($method === 'GET' && ($parts[1] ?? '') === 'new') {
            $siteRoot = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME']))), '/');
            header('Location: ' . $siteRoot . '/contact/customer_list_API/new.html');
            exit;
        }
        if ($method === 'GET' && $id !== null && count($parts) === 2) {
            $stmt = db()->prepare('SELECT * FROM ' . t('customers') . ' WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $row ? respond(customer_out($row)) : fail(404, 'Customer ID not found.');
        }
        if ($method === 'GET' && count($parts) === 7) {
            respond([
                'id' => $parts[1], 'name' => $parts[2], 'email' => $parts[3],
                'age' => $parts[4], 'location' => $parts[5], 'occupation' => $parts[6],
            ]);
        }
        if ($method === 'POST' && count($parts) === 1) {
            $in = input();
            $name = text($in, 'name');
            $email = valid_email(text($in, 'email'));
            $age = filter_var($in['age'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 150]]);
            if ($age === false) {
                fail(422, 'Please enter a valid age.');
            }
            $location = text($in, 'location');
            $occupation = text($in, 'occupation');
            db()->prepare('INSERT INTO ' . t('customers') . ' (name, email, age, location, occupation) VALUES (?, ?, ?, ?, ?)')
                ->execute([$name, $email, $age, $location, $occupation]);
            respond(all_customers());
        }
        break;

    case 'delete':
        if ($method === 'DELETE' && $id !== null) {
            require_admin();
            $stmt = db()->prepare('DELETE FROM ' . t('customers') . ' WHERE id = ?');
            $stmt->execute([$id]);
            $stmt->rowCount() ? respond(all_customers()) : fail(404, 'Customer ID not found.');
        }
        break;

    // ----------------------------------------------------------------- products
    case 'products':
        if ($method === 'GET' && count($parts) === 1) {
            respond(array_map('product_out', db()->query('SELECT * FROM ' . t('products') . ' ORDER BY id')->fetchAll()));
        }
        if ($method === 'POST' && count($parts) === 1) {
            require_admin();
            $in = input();
            $price = $in['price'] ?? null;
            if (!is_numeric($price) || $price < 0) {
                fail(422, "Field 'price' must be a number.");
            }
            $pdo = db();
            $pdo->prepare('INSERT INTO ' . t('products') . ' (image, title, price, description, category) VALUES (?, ?, ?, ?, ?)')
                ->execute([text($in, 'image'), text($in, 'title'), $price, text($in, 'desc', 500), text($in, 'category', 100)]);
            $stmt = $pdo->prepare('SELECT * FROM ' . t('products') . ' WHERE id = ?');
            $stmt->execute([(int) $pdo->lastInsertId()]);
            respond(product_out($stmt->fetch()), 201);
        }
        if ($method === 'PUT' && $id !== null && count($parts) === 2) {
            require_admin();
            $in = input();
            $price = $in['price'] ?? null;
            if (!is_numeric($price) || $price < 0) {
                fail(422, "Field 'price' must be a number.");
            }
            $pdo = db();
            $stmt = $pdo->prepare('UPDATE ' . t('products') . ' SET image = ?, title = ?, price = ?, description = ?, category = ? WHERE id = ?');
            $stmt->execute([text($in, 'image'), text($in, 'title'), $price, text($in, 'desc', 500), text($in, 'category', 100), $id]);
            $stmt = $pdo->prepare('SELECT * FROM ' . t('products') . ' WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $row ? respond(product_out($row)) : fail(404, 'Product not found');
        }
        if ($method === 'DELETE' && $id !== null && count($parts) === 2) {
            require_admin();
            db()->prepare('DELETE FROM ' . t('products') . ' WHERE id = ?')->execute([$id]);
            http_response_code(204);
            exit;
        }
        break;

    // --------------------------------------------------------------- login/signup
    case 'signup':
        if ($method === 'POST') {
            $in = input();
            $name = text($in, 'name');
            $email = valid_email(text($in, 'email'));
            $age = text($in, 'age', 20);
            $location = text($in, 'location');
            $occupation = text($in, 'occupation');
            $password = text($in, 'password', 255);

            $pdo = db();
            $exists = $pdo->prepare('SELECT 1 FROM ' . t('users') . ' WHERE email = ?');
            $exists->execute([$email]);
            if ($exists->fetch()) {
                fail(409, 'That email is already registered.');
            }
            $pdo->prepare('INSERT INTO ' . t('users') . ' (name, email, age, location, occupation, password_hash) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$name, $email, $age, $location, $occupation, password_hash($password, PASSWORD_DEFAULT)]);
            respond(['ok' => true], 201);
        }
        break;

    case 'login':
        if ($method === 'POST') {
            $in = input();
            $email = strtolower(trim((string) ($in['email'] ?? '')));
            $password = (string) ($in['password'] ?? '');
            $stmt = db()->prepare('SELECT name, password_hash FROM ' . t('users') . ' WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if (!$user) {
                fail(404, 'User not found');
            }
            if (!password_verify($password, $user['password_hash'])) {
                fail(401, 'Incorrect password');
            }
            respond(['ok' => true, 'name' => $user['name']]);
        }
        break;

    // ------------------------------------------------------------------ messages
    case 'contacts':
        if ($method === 'GET' && count($parts) === 1) {
            respond(db()->query('SELECT fullname, email, contact, message, created_at FROM ' . t('contacts') . ' ORDER BY id')->fetchAll());
        }
        if ($method === 'POST' && count($parts) === 1) {
            $in = input();
            db()->prepare('INSERT INTO ' . t('contacts') . ' (fullname, email, contact, message, created_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([text($in, 'fullname'), text($in, 'email'), text($in, 'contact', 100), text($in, 'message', 5000), gmdate('Y-m-d H:i:s')]);
            respond(['ok' => true], 201);
        }
        break;

    case '':
        respond(['name' => "PAPA J's API", 'routes' => ['customers', 'products', 'signup', 'login', 'contacts']]);
}

fail(404, 'Route not found.');
