// My Orders: find the orders placed with a contact number and rate the products of completed orders.
(function () {
    var form = document.getElementById('lookup-form');
    var input = document.getElementById('lookup-contact');
    var button = document.getElementById('lookup-btn');
    var results = document.getElementById('orders-results');
    var contact = '';

    function esc(value) {
        var div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }

    function peso(n) {
        return '₱ ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function when(stamp) {
        var d = new Date(String(stamp).replace(' ', 'T') + 'Z');
        return isNaN(d) ? '' : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function note(message, isError) {
        results.innerHTML = '<div class="orders-note' + (isError ? ' error' : '') + '">' + esc(message) + '</div>';
    }

    async function post(path, body) {
        var response = await fetch('../../api/' + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Something went wrong.');
        return data;
    }

    async function lookup(number) {
        contact = number;
        button.disabled = true;
        button.textContent = 'Searching...';
        try {
            var orders = await post('orders/lookup', { contact: number });
            try { sessionStorage.setItem('papaj_contact', number); } catch (e) { /* storage may be blocked */ }
            render(orders);
        } catch (err) {
            note(err.message, true);
        }
        button.disabled = false;
        button.textContent = 'Find my orders';
    }

    function stars(n, name) {
        var out = '';
        for (var i = 1; i <= 5; i++) {
            out += '<button type="button" class="rate-star' + (i <= n ? ' on' : '') + '" data-value="' + i + '" aria-label="' + i + ' out of 5 for ' + esc(name) + '"><i class="fa-solid fa-bacon"></i></button>';
        }
        return out;
    }

    function itemHtml(order, line) {
        var right;
        if (line.rated) {
            right = '<div class="rate-done">You rated this <span class="rate-stars">' + stars(line.rated, line.title) + '</span></div>';
        } else if (order.status === 'completed') {
            right = '<div class="rate-box" data-order="' + order.id + '" data-product="' + line.id + '" data-chosen="0">' +
                '<div class="rate-stars" role="group" aria-label="Rate ' + esc(line.title) + '">' + stars(0, line.title) + '</div>' +
                '<div class="rate-actions"><span class="rate-msg"></span><button type="button" class="rate-submit" disabled>Submit rating</button></div></div>';
        } else if (order.status === 'cancelled') {
            right = '<div class="rate-wait">This order was cancelled.</div>';
        } else {
            right = '<div class="rate-wait">You can rate this once your order is completed.</div>';
        }
        return '<li class="order-item" style="list-style:none"><img src="' + esc(line.image) + '" alt="">' +
            '<span class="order-item-name">' + esc(line.title) + '<span class="order-item-qty">' + line.qty + ' × ' + peso(line.price) + '</span></span>' + right + '</li>';
    }

    function render(orders) {
        if (!orders.length) {
            note('We could not find any orders for that contact number. Please check the number you used at checkout.');
            return;
        }
        results.innerHTML = orders.map(function (o) {
            return '<section class="order-card"><div class="order-top"><h2>Order #' + o.id + '</h2>' +
                '<span class="order-status ' + esc(o.status) + '">' + esc(o.status) + '</span>' +
                '<span class="order-date">' + when(o.created_at) + '</span>' +
                '<span class="order-total">' + peso(o.total) + '</span></div>' +
                '<ul style="margin:0;padding:0">' + o.items.map(function (l) { return itemHtml(o, l); }).join('') + '</ul></section>';
        }).join('');
    }

    function paint(box, n) {
        Array.prototype.forEach.call(box.querySelectorAll('.rate-star'), function (s) {
            s.classList.toggle('on', Number(s.getAttribute('data-value')) <= n);
        });
    }

    results.addEventListener('click', async function (e) {
        var star = e.target.closest('.rate-star');
        var box = e.target.closest('.rate-box');
        if (star && box) {
            var n = Number(star.getAttribute('data-value'));
            box.setAttribute('data-chosen', n);
            paint(box, n);
            box.querySelector('.rate-submit').disabled = false;
            box.querySelector('.rate-msg').textContent = '';
            return;
        }
        var submit = e.target.closest('.rate-submit');
        if (!submit) return;
        box = submit.closest('.rate-box');
        var msg = box.querySelector('.rate-msg');
        var chosen = Number(box.getAttribute('data-chosen'));
        submit.disabled = true;
        msg.className = 'rate-msg';
        msg.textContent = 'Saving...';
        try {
            var data = await post('orders/' + box.getAttribute('data-order') + '/rate', {
                contact: contact,
                product_id: Number(box.getAttribute('data-product')),
                rating: chosen
            });
            box.outerHTML = '<div class="rate-done">Thanks! You rated this <span class="rate-stars">' + stars(chosen, '') + '</span></div>';
        } catch (err) {
            msg.className = 'rate-msg error';
            msg.textContent = err.message;
            submit.disabled = false;
        }
    });

    results.addEventListener('mouseover', function (e) {
        var star = e.target.closest('.rate-star');
        var box = e.target.closest('.rate-box');
        if (star && box) paint(box, Number(star.getAttribute('data-value')));
    });
    results.addEventListener('mouseout', function (e) {
        var box = e.target.closest('.rate-box');
        if (box && !box.contains(e.relatedTarget)) paint(box, Number(box.getAttribute('data-chosen')));
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var number = input.value.trim();
        if (number.replace(/\D/g, '').length < 7) {
            note('Please enter the contact number you used when ordering.', true);
            return;
        }
        lookup(number);
    });

    // Coming from checkout: the number is remembered for this visit, so the orders show straight away.
    var saved = '';
    try { saved = sessionStorage.getItem('papaj_contact') || ''; } catch (e) { /* ignore */ }
    if (saved) {
        input.value = saved;
        lookup(saved);
    }
})();
