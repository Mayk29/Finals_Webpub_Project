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
            $pdo = db();
            ensure_ratings_table($pdo);
            respond(array_map('product_out', $pdo->query('SELECT p.*, r.rating, r.votes FROM ' . t('products') . ' p LEFT JOIN ' . t('product_ratings') . ' r ON r.product_id = p.id ORDER BY p.id')->fetchAll()));
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

    // ------------------------------------------------------------------- orders
    case 'orders':
        // Customer: find the orders placed with a contact number (name and address are never returned).
        if ($method === 'POST' && ($parts[1] ?? '') === 'lookup' && count($parts) === 2) {
            $in = input();
            $key = digits((string) ($in['contact'] ?? ''));
            if (strlen($key) < 7) {
                fail(422, 'Please enter the contact number you used when ordering.');
            }
            $pdo = db();
            ensure_order_extras($pdo);
            $stmt = $pdo->prepare('SELECT id, status, items, total, created_at FROM ' . t('orders') . ' WHERE ' . contact_sql() . ' = ? ORDER BY id DESC LIMIT 20');
            $stmt->execute([$key]);
            $orders = $stmt->fetchAll();
            $images = [];
            foreach ($pdo->query('SELECT id, image FROM ' . t('products'))->fetchAll() as $p) {
                $images[(int) $p['id']] = $p['image'];
            }
            $rated = $pdo->prepare('SELECT product_id, rating FROM ' . t('order_ratings') . ' WHERE order_id = ?');
            foreach ($orders as &$o) {
                $o['id'] = (int) $o['id'];
                $o['total'] = num($o['total']);
                $rated->execute([$o['id']]);
                $mine = [];
                foreach ($rated->fetchAll() as $r) {
                    $mine[(int) $r['product_id']] = (int) $r['rating'];
                }
                $o['items'] = array_map(function ($line) use ($images, $mine) {
                    $line['image'] = $images[$line['id']] ?? '';
                    $line['rated'] = $mine[$line['id']] ?? null;
                    return $line;
                }, json_decode($o['items'], true) ?: []);
            }
            respond($orders);
        }
        // Customer: rate one product of a completed order, once.
        if ($method === 'POST' && $id !== null && ($parts[2] ?? '') === 'rate' && count($parts) === 3) {
            $in = input();
            $key = digits((string) ($in['contact'] ?? ''));
            $pid = (int) ($in['product_id'] ?? 0);
            $stars = (int) ($in['rating'] ?? 0);
            if (strlen($key) < 7 || $pid < 1 || $stars < 1 || $stars > 5) {
                fail(422, 'Please choose a rating from 1 to 5.');
            }
            $pdo = db();
            ensure_order_extras($pdo);
            ensure_ratings_table($pdo);
            $stmt = $pdo->prepare('SELECT status, items FROM ' . t('orders') . ' WHERE id = ? AND ' . contact_sql() . ' = ?');
            $stmt->execute([$id, $key]);
            $order = $stmt->fetch();
            if (!$order) {
                fail(404, 'Order not found for that contact number.');
            }
            if ($order['status'] !== 'completed') {
                fail(403, 'You can rate products once your order is completed.');
            }
            $inOrder = false;
            foreach (json_decode($order['items'], true) ?: [] as $line) {
                if ((int) $line['id'] === $pid) {
                    $inOrder = true;
                }
            }
            if (!$inOrder) {
                fail(422, 'That product is not part of this order.');
            }
            $dup = $pdo->prepare('SELECT 1 FROM ' . t('order_ratings') . ' WHERE order_id = ? AND product_id = ?');
            $dup->execute([$id, $pid]);
            if ($dup->fetch()) {
                fail(409, 'You already rated this product for this order.');
            }
            $pdo->beginTransaction();
            $pdo->prepare('INSERT INTO ' . t('order_ratings') . ' (order_id, product_id, rating, created_at) VALUES (?, ?, ?, ?)')
                ->execute([$id, $pid, $stars, gmdate('Y-m-d H:i:s')]);
            $pdo->prepare('UPDATE ' . t('product_ratings') . ' SET rating = ROUND((rating * votes + ?) / (votes + 1), 2), votes = votes + 1 WHERE product_id = ?')
                ->execute([$stars, $pid]);
            $pdo->commit();
            $now = $pdo->prepare('SELECT rating, votes FROM ' . t('product_ratings') . ' WHERE product_id = ?');
            $now->execute([$pid]);
            $r = $now->fetch();
            respond(['ok' => true, 'rating' => round((float) $r['rating'], 1), 'votes' => (int) $r['votes']], 201);
        }
        // Admin: mark an order pending, completed or cancelled.
        if ($method === 'PUT' && $id !== null && count($parts) === 2) {
            require_admin();
            $status = (string) (input()['status'] ?? '');
            if (!in_array($status, ['pending', 'completed', 'cancelled'], true)) {
                fail(422, "Status must be 'pending', 'completed' or 'cancelled'.");
            }
            $pdo = db();
            ensure_order_extras($pdo);
            $pdo->prepare('UPDATE ' . t('orders') . ' SET status = ? WHERE id = ?')->execute([$status, $id]);
            $chk = $pdo->prepare('SELECT 1 FROM ' . t('orders') . ' WHERE id = ?');
            $chk->execute([$id]);
            $chk->fetch() ? respond(['ok' => true, 'id' => $id, 'status' => $status]) : fail(404, 'Order not found.');
        }
        if ($method === 'POST' && count($parts) === 1) {
            $in = input();
            $name = text($in, 'name', 100);
            $contact = text($in, 'contact', 30);
            if (!preg_match('/^[0-9+()\-\s]{7,30}$/', $contact)) {
                fail(422, 'Please enter a valid contact number.');
            }
            $type = (string) ($in['type'] ?? '');
            if (!in_array($type, ['pickup', 'dine-in', 'delivery'], true)) {
                fail(422, 'Please choose how you want to receive your order.');
            }
            $address = trim((string) ($in['address'] ?? ''));
            if ($type === 'delivery' && $address === '') {
                fail(422, 'Please enter your delivery address.');
            }
            $notes = trim((string) ($in['notes'] ?? ''));
            if (strlen($address) > 500 || strlen($notes) > 500) {
                fail(422, 'Address or notes are too long.');
            }
            $raw = $in['items'] ?? [];
            if (!is_array($raw) || count($raw) < 1 || count($raw) > 50) {
                fail(422, 'Your cart is empty.');
            }
            // Prices come from the products table, never from the browser.
            $pdo = db();
            $lookup = $pdo->prepare('SELECT title, price FROM ' . t('products') . ' WHERE id = ?');
            $lines = [];
            $total = 0;
            foreach ($raw as $row) {
                $pid = (int) ($row['id'] ?? 0);
                $qty = (int) ($row['qty'] ?? 0);
                if ($qty < 1 || $qty > 99) {
                    fail(422, 'Invalid quantity.');
                }
                $lookup->execute([$pid]);
                $p = $lookup->fetch();
                if (!$p) {
                    fail(422, 'An item in your cart is no longer available.');
                }
                $lines[] = ['id' => $pid, 'title' => $p['title'], 'price' => num($p['price']), 'qty' => $qty];
                $total += $p['price'] * $qty;
            }
            ensure_orders_table($pdo);
            $pdo->prepare('INSERT INTO ' . t('orders') . ' (name, contact, order_type, address, notes, items, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$name, $contact, $type, $address, $notes, json_encode($lines, JSON_UNESCAPED_UNICODE), $total, gmdate('Y-m-d H:i:s')]);
            respond(['ok' => true, 'id' => (int) $pdo->lastInsertId(), 'total' => num($total)], 201);
        }
        if ($method === 'GET' && count($parts) === 1) {
            require_admin();
            $pdo = db();
            ensure_order_extras($pdo);
            $rows = $pdo->query('SELECT * FROM ' . t('orders') . ' ORDER BY id DESC')->fetchAll();
            foreach ($rows as &$r) {
                $r['id'] = (int) $r['id'];
                $r['total'] = num($r['total']);
                $r['items'] = json_decode($r['items'], true);
            }
            respond($rows);
        }
        break;

    // ------------------------------------------------------------------ messages
    case 'contacts':
        if ($method === 'GET' && count($parts) === 1) {
            // Visitors only see name, message and date. Email and phone are
            // private: they need the admin key (?full=1 + X-Admin-Key header).
            $full = isset($_GET['full']);
            if ($full) {
                require_admin();
            }
            $columns = $full ? 'fullname, email, contact, message, created_at' : 'fullname, message, created_at';
            respond(db()->query('SELECT ' . $columns . ' FROM ' . t('contacts') . ' ORDER BY id')->fetchAll());
        }
        if ($method === 'POST' && count($parts) === 1) {
            $in = input();
            db()->prepare('INSERT INTO ' . t('contacts') . ' (fullname, email, contact, message, created_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([text($in, 'fullname'), text($in, 'email'), text($in, 'contact', 100), text($in, 'message', 5000), gmdate('Y-m-d H:i:s')]);
            respond(['ok' => true], 201);
        }
        break;

    case '':
        respond(['name' => "PAPA J's API", 'routes' => ['customers', 'products', 'signup', 'login', 'contacts', 'orders']]);
}

fail(404, 'Route not found.');
