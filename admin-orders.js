document.addEventListener("DOMContentLoaded", function() {
    const ordersList = document.getElementById("ordersList");

    function fetchOrders() {
        fetch('https://il-gambero-rosso-github-io.onrender.com/orders')
            .then(response => response.json())
            .then(orders => {
                ordersList.innerHTML = '';
                orders.forEach(order => {
                    const orderItem = document.createElement("div");
                    orderItem.classList.add("order-item");
                    orderItem.innerHTML = `
                        <p>ID: ${order.id}</p>
                        <p>Ім'я: ${order.username}</p>
                        <p>Додаткові побажання: ${order.additionalRequests}</p>
                        <p>Елементи замовлення IDs: ${order.orderedItemsIds}</p>
                        <button class="delete-button" data-id="${order.id}">Видалити</button>
                    `;
                    ordersList.appendChild(orderItem);
                });

                document.querySelectorAll(".delete-button").forEach(button => {
                    button.addEventListener("click", function() {
                        const orderId = this.dataset.id;
                        deleteOrder(orderId);
                    });
                });
            })
            .catch(error => console.error('Error fetching orders:', error));
    }

    function deleteOrder(id) {
        fetch(`https://il-gambero-rosso-github-io.onrender.com/orders/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Замовлення успішно видалено.");
                fetchOrders();
            } else {
                alert("Помилка при видаленні замовлення.");
            }
        })
        .catch(error => console.error('Error:', error));
    }

    fetchOrders();

   
    function fetchDishes(event) {
        event.preventDefault();
        fetch('https://il-gambero-rosso-github-io.onrender.com/menu')
            .then(response => response.json())
            .then(menu => {
                const modal = document.getElementById("myModal");
                const modalContent = document.getElementById("modalContent");

                modalContent.innerHTML = '';
                menu.forEach(item => {
                    const dishItem = document.createElement("div");
                    dishItem.classList.add("dish-item");
                    dishItem.innerHTML = `
                        <p><strong>ID:</strong> ${item.id}</p>
                        <p><strong>Назва:</strong> ${item.name}</p>
                    `;
                    modalContent.appendChild(dishItem);
                });

                modal.style.display = "block";
            })
            .catch(error => console.error('Error fetching menu:', error));
    }


    const viewDishesLink = document.getElementById("viewDishesLink");
    viewDishesLink.addEventListener("click", fetchDishes);


    const modal = document.getElementById("myModal");
    const closeButton = document.querySelector(".close");

    closeButton.addEventListener("click", function() {
        modal.style.display = "none";
    });


    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
});
