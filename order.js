document.addEventListener("DOMContentLoaded", function() 
{
    const checkoutButton = document.getElementById("checkout-button");

    function addToCart(product) 
    {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Продукт успішно додано до замовлення!");
    }

    checkoutButton.addEventListener("click", function() 
    {
        const username = prompt("Будь ласка, введіть ваше ім'я:");
        if (username) {
            checkoutOrder(username);
        }
    });

    function checkoutOrder(username) 
    {
        const additionalRequests = prompt("Будь ласка, введіть додаткові побажання:");
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const orderedItemsIds = cart.map(product => product.id).join(",");

        fetch('https://il-gambero-rosso-github-io.onrender.com/orders', 
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, additionalRequests, orderedItemsIds })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) 
                {
                alert("Замовлення успішно оформлено!");
                localStorage.removeItem("cart");
                displayOrders();
            } else {
                alert("Помилка при оформленні замовлення.");
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function displayOrders() 
    {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const ordersContainer = document.getElementById("orders");
        ordersContainer.innerHTML = "";

        if (cart.length === 0) 
            {
            ordersContainer.textContent = "У вас немає замовлень.";
            ordersContainer.classList.add("no-orders");
            checkoutButton.style.display = "none";
        } else {
            ordersContainer.classList.remove("no-orders");
            cart.forEach(product => {
                const orderItem = document.createElement("div");
                orderItem.classList.add("order-item");
                orderItem.innerHTML = `
                    <p>${product.name} - Вага: ${product.weight} г. - Ціна: ${product.price} грн.</p>
                    <button class="remove-button" data-name="${product.name}">✖</button>
                `;
                orderItem.querySelector(".remove-button").addEventListener("click", function() 
                {
                    const productName = this.dataset.name;
                    removeFromCart(productName);
                });
                ordersContainer.appendChild(orderItem);
            });

            checkoutButton.style.display = "block";
        }
    }

    function removeFromCart(productName) 
    {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const index = cart.findIndex(product => product.name === productName);
        if (index !== -1) 
            {
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            alert("Замовлення успішно видалено.");
            displayOrders();
        } else 
        {
            alert("Помилка: Замовлення не знайдено.");
        }
    }

    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    addToCartButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            const product = {
                name: button.dataset.name,
                price: button.dataset.price,
                image: button.dataset.image,
                description: button.dataset.description,
                weight: button.dataset.weight
            };
            addToCart(product);
        });
    });

    displayOrders();
});
