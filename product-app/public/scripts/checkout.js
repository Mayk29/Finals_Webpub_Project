// Checkout modal for the products page. Reads the cart and products from script.js.
(function () {
    var backdrop = null;
    var lastFocus = null;

    function peso(n) {
        return '₱ ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function esc(value) {
        var div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }

    function lines() {
        return cart.map(function (item) {
            var product = products.find(function (p) { return p.id === item.id; });
            return product ? { id: product.id, title: product.title, price: product.price, qty: item.quantity, image: product.image } : null;
        }).filter(Boolean);
    }

    function build() {
        backdrop = document.createElement('div');
        backdrop.className = 'co-backdrop';
        backdrop.innerHTML =
            '<div class="co-modal" role="dialog" aria-modal="true" aria-labelledby="co-title">' +
                '<div class="co-head"><h2 class="co-title" id="co-title">Checkout</h2>' +
                '<button type="button" class="co-close" aria-label="Close">&times;</button></div>' +
                '<div class="co-body" id="co-content"></div>' +
            '</div>';
        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
        backdrop.querySelector('.co-close').addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (!backdrop.classList.contains('open')) return;
            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'Tab') trapFocus(e);
        });
    }

    function trapFocus(e) {
        var nodes = backdrop.querySelectorAll('button, input, select, textarea, a[href]');
        var visible = Array.prototype.filter.call(nodes, function (n) { return !n.disabled && n.offsetParent !== null; });
        if (!visible.length) return;
        var first = visible[0], last = visible[visible.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function open() {
        var items = lines();
        if (!items.length) {
            var foot = document.querySelector('.sidebar .foot');
            if (foot && !document.getElementById('co-empty-note')) {
                var note = document.createElement('p');
                note.id = 'co-empty-note';
                note.style.cssText = 'color:#ffba15;font-size:16px;width:100%;text-align:center';
                note.textContent = 'Add something to your cart first.';
                foot.parentNode.insertBefore(note, foot.nextSibling);
                setTimeout(function () { note.remove(); }, 3000);
            }
            return;
        }
        if (!backdrop) build();
        lastFocus = document.activeElement;
        render(items);
        document.body.classList.add('co-lock');
        backdrop.classList.add('open');
        var first = backdrop.querySelector('input');
        if (first) first.focus();
    }

    function close() {
        backdrop.classList.remove('open');
        document.body.classList.remove('co-lock');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function render(items) {
        var total = items.reduce(function (sum, l) { return sum + l.price * l.qty; }, 0);
        var list = items.map(function (l) {
            return '<li class="co-item"><img src="' + esc(l.image) + '" alt="">' +
                '<span class="co-item-name">' + esc(l.title) + '<span class="co-item-qty">' + l.qty + ' × ' + peso(l.price) + '</span></span>' +
                '<span class="co-item-price">' + peso(l.price * l.qty) + '</span></li>';
        }).join('');

        document.getElementById('co-content').innerHTML =
            '<h3>Your order</h3><ul class="co-items">' + list + '</ul>' +
            '<div class="co-total"><span>Total</span><strong>' + peso(total) + '</strong></div>' +
            '<h3>Your details</h3>' +
            '<form id="co-form" novalidate>' +
                '<div class="co-error" id="co-error" role="alert" hidden></div>' +
                '<div class="co-field"><label for="co-name">Full name</label><input id="co-name" name="name" autocomplete="name" maxlength="100" required></div>' +
                '<div class="co-field"><label for="co-contact">Contact number</label><input id="co-contact" name="contact" type="tel" autocomplete="tel" maxlength="30" required></div>' +
                '<div class="co-field"><label for="co-type">How would you like your order?</label>' +
                    '<select id="co-type" name="type"><option value="pickup">Pick up</option><option value="dine-in">Dine in</option><option value="delivery">Delivery</option></select></div>' +
                '<div class="co-field" id="co-address-field" hidden><label for="co-address">Delivery address</label><input id="co-address" name="address" autocomplete="street-address" maxlength="500"></div>' +
                '<div class="co-field"><label for="co-notes">Notes (optional)</label><textarea id="co-notes" name="notes" maxlength="500"></textarea></div>' +
                '<div class="co-actions">' +
                    '<button type="submit" class="co-btn co-btn-primary" id="co-submit">Place Order</button>' +
                    '<button type="button" class="co-btn co-btn-secondary" id="co-back">Back to cart</button>' +
                '</div>' +
            '</form>';

        var type = document.getElementById('co-type');
        type.addEventListener('change', function () {
            document.getElementById('co-address-field').hidden = type.value !== 'delivery';
        });
        document.getElementById('co-back').addEventListener('click', close);
        document.getElementById('co-form').addEventListener('submit', submit);
    }

    function showError(message) {
        var box = document.getElementById('co-error');
        box.textContent = message;
        box.hidden = false;
        box.scrollIntoView({ block: 'nearest' });
    }

    async function submit(e) {
        e.preventDefault();
        var form = e.target;
        var data = {
            name: form.name.value.trim(),
            contact: form.contact.value.trim(),
            type: form.type.value,
            address: form.address.value.trim(),
            notes: form.notes.value.trim(),
            items: lines().map(function (l) { return { id: l.id, qty: l.qty }; })
        };
        if (!data.name) return showError('Please enter your name.');
        if (!/^[0-9+()\-\s]{7,30}$/.test(data.contact)) return showError('Please enter a valid contact number.');
        if (data.type === 'delivery' && !data.address) return showError('Please enter your delivery address.');

        var button = document.getElementById('co-submit');
        button.disabled = true;
        button.textContent = 'Placing order...';
        try {
            var response = await fetch('../../api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            var result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Something went wrong.');
            try { sessionStorage.setItem('papaj_contact', data.contact); } catch (e) { /* storage may be blocked */ }
            done(result, data.type);
        } catch (err) {
            showError(err.message);
            button.disabled = false;
            button.textContent = 'Place Order';
        }
    }

    function done(result, type) {
        var how = { 'pickup': 'We will have it ready for pick up.', 'dine-in': 'We will have your table ready.', 'delivery': 'We will bring it to your address.' }[type];
        document.getElementById('co-content').innerHTML =
            '<div class="co-done"><h3>Thank you for your order!</h3>' +
            '<p>Your order number</p><p class="co-order-no">#' + result.id + '</p>' +
            '<p>Total: ' + peso(result.total) + '</p><p>' + how + '</p>' +
            '<div class="co-actions"><button type="button" class="co-btn co-btn-primary" id="co-finish">Back to menu</button>' +
            '<a class="co-btn co-btn-secondary" href="orders.html" style="text-align:center;text-decoration:none">My orders</a></div></div>';
        document.getElementById('co-finish').addEventListener('click', close);
        document.getElementById('co-finish').focus();
        cart = [];
        updateCart();
        updateCartCount();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var button = document.querySelector('.checkout-btn');
        if (button) button.addEventListener('click', open);
    });
})();
