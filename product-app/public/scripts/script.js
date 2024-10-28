let cart = [];
let products = [];

// Function to fetch products from the REST API
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        products = await response.json();
        console.log('Fetched Products:', products); 
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Function to display products
function displayProducts(productsToDisplay) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; 

    productsToDisplay.forEach(product => {
        const productBox = document.createElement('div');
        productBox.classList.add('box', 'product');

        productBox.innerHTML = `
            <div class="img-box">
                <img class='images' src="${product.image}" alt="${product.title}">
            </div>
            <div class="buttom">
                <p class="product-title">${product.title}</p>
                <h4 class="product-desc">${product.desc}</h4>
                <div class="rating">
                    <span class="samgyup s1" data-value="1"><i class="fa-solid fa-bacon"></i></span>
                    <span class="samgyup s2" data-value="2"><i class="fa-solid fa-bacon"></i></span>
                    <span class="samgyup s3" data-value="3"><i class="fa-solid fa-bacon"></i></span>
                    <span class="samgyup s4" data-value="4"><i class="fa-solid fa-bacon"></i></span>
                    <span class="samgyup s5" data-value="5"><i class="fa-solid fa-bacon"></i></span>
                </div>
                <div class="average-rating">Samgyup Level: <span class="avg-rating">0</span></div>
                <p class="product-category" style="color:white;">Category: ${product.category}</p>
                <h2 class="product-price" style="color:gold;">₱ ${product.price}</h2>
                <div class="quantity-control">
                    <button class="quantity-decrease" onclick="changeQuantity(${product.id}, -1)">-</button>
                    <span class="quantity-display">1</span>
                    <button class="quantity-increase" onclick="changeQuantity(${product.id}, 1)">+</button>
                </div>
                <button class="btn add-to-cart-btn" style="color:white;" id="add" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        `;
        productList.appendChild(productBox);
    });

    // Set up rating event listeners after products are displayed
    document.querySelectorAll('.rating .samgyup').forEach(samgyup => {
        samgyup.addEventListener('click', function() {
            const rating = this.getAttribute('data-value');
            const samgyups = this.parentNode.children;

            for (let i = 0; i < samgyups.length; i++) {
                samgyups[i].classList.remove('selected');
                if (i < rating) {
                    samgyups[i].classList.add('selected');
                }
            }

            const avgRatingElement = this.closest('.product').querySelector('.avg-rating');
            avgRatingElement.textContent = rating;
        });
    });
}

// Function to change quantity of product in the cart
function changeQuantity(productId, amount) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity += amount;
        if (product.quantity <= 0) {
            removeFromCart(productId);
        }
    }
    updateCart();
}

function addToCart(productId) {
    const product = products.find(item => item.id === productId);
    if (product) {
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += 1; 
        } else {
            cart.push({ id: productId, quantity: 1, image: product.image }); 
        }
        updateCartCount(); 
    }
    console.log('Cart:', cart); 
    updateCart();
}

function updateCart() {
    console.log('Updating cart...');
    console.log('Current cart:', cart);
    
    const cartItem = document.getElementById('cart-item');
    const totalDisplay = document.getElementById('total');

    // If the cart is empty, display a message
    if (cart.length === 0) {
        cartItem.innerHTML = 'Your cart is empty';
    } else {
        cartItem.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) {
                console.warn(`Product with ID ${item.id} not found in products array.`);
                return ''; 
            }
            return `
                <div class="cart-item-template">
                    <img src="${item.image}" alt="${product.title}" class="row-img"> <!-- Include the product image -->
                    <p class="cart-item-title" style="color:white;">${product.title}</p>
                    <h2 class="cart-item-price" style="color:white;">₱ ${product.price * item.quantity}</h2>
                    <i class="fa-solid fa-trash" onclick="removeFromCart(${product.id})" style="cursor:pointer;"></i>
                </div>
            `;
        }).join(''); // Ensure to use join('')
    }

    // Calculate and display the total price
    const totalPrice = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0); 
    }, 0);
    totalDisplay.innerText = `₱ ${totalPrice.toFixed(2)}`;
}
// Function to update cart count
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('count');
    cartCountElement.innerText = totalItems; // Update display
}
// Function to remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    updateCartCount();
}

// Function to sort products by price
function sortProductsByPrice(products, sortType) {
    if (sortType === 'ascending') {
        return products.sort((a, b) => a.price - b.price);
    } else if (sortType === 'descending') {
        return products.sort((a, b) => b.price - a.price);
    } else {
        return products;
    }
}

// Function to filter products by category
function filterProductsByCategory(products, category) {
    if (category === 'all') {
        return products;
    } else {
        return products.filter(product => product.category === category);
    }
}

// Function to search products by name
function searchProductsByName(products, searchTerm) {
    return products.filter(product => product.title.toLowerCase().includes(searchTerm.toLowerCase()));
}

// Event listeners for sorting, filtering, and searching
document.getElementById('sort-price').addEventListener('change', () => {
    const sortType = document.getElementById('sort-price').value;
    const sortedProducts = sortProductsByPrice(products, sortType);
    displayProducts(sortedProducts);
});

document.getElementById('category-select').addEventListener('change', () => {
    const category = document.getElementById('category-select').value;
    const filteredProducts = filterProductsByCategory(products, category);
    displayProducts(filteredProducts);
});

document.getElementById('search-input').addEventListener('input', () => {
    const searchTerm = document.getElementById('search-input').value;
    const searchedProducts = searchProductsByName(products, searchTerm);
    displayProducts(searchedProducts);
});

// Call fetchProducts on page load
document.addEventListener('DOMContentLoaded', fetchProducts);