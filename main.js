document.addEventListener("DOMContentLoaded", function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    function fetchMenu() {
        fetch('https://eu-cluster-west-01.k8s.cleardb.net/menu')
            .then(response => response.json())
            .then(menu => {
                renderMenu(menu);
            });
    }

    function renderMenu(menu) {
        const menuContainer = document.getElementById("menu");
        menuContainer.innerHTML = '';
        const categories = [...new Set(menu.map(item => item.category))];
        categories.forEach(category => {
            const categoryDiv = document.createElement("div");
            categoryDiv.classList.add("category");
            const categoryHeader = document.createElement("h3");
            categoryHeader.textContent = category;
            categoryHeader.addEventListener("click", function() {
                categoryDiv.classList.toggle("open");
                const categoryItems = categoryDiv.querySelectorAll(".menu-item");
                categoryItems.forEach(item => {
                    item.classList.toggle("show");
                });
            });
            categoryDiv.appendChild(categoryHeader);
            const categoryProducts = menu.filter(item => item.category === category);
            categoryProducts.forEach(product => {
                const menuItem = document.createElement("div");
                menuItem.classList.add("menu-item");
                menuItem.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <h4>${product.name}</h4>
                    <p>Ціна: ${product.price} грн.</p>
                    <p class="weight">Вага: ${product.weight} г.</p>
                    <p class="dish-description">${product.description}</p>
                    <button class="add-to-cart" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}" data-description="${product.description}" data-weight="${product.weight}">Зробити замовлення</button>
                    <button class="comment-button">💬</button>
                `;
                menuItem.querySelector(".add-to-cart").addEventListener("click", function() {
                    addToCart(product);
                });
                menuItem.querySelector(".comment-button").addEventListener("click", function() {
                    openCommentModal(product.id);
                });
                if (currentUser && currentUser.role === "admin") {
                    const editButton = document.createElement("button");
                    editButton.textContent = "✎";
                    editButton.classList.add("edit-button");
                    editButton.addEventListener("click", () => openEditModal(product));
                    menuItem.appendChild(editButton);
    
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "✖";
                    deleteButton.classList.add("delete-button");
                    deleteButton.addEventListener("click", () => deleteProduct(product.id));
                    menuItem.appendChild(deleteButton);
                }
                categoryDiv.appendChild(menuItem);
            });
            menuContainer.appendChild(categoryDiv);
        });
    }
    

    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Продукт успішно додано до замовлення!");
    }

    function deleteProduct(id) {
        fetch(`https://eu-cluster-west-01.k8s.cleardb.net/menu${id}`, {
            method: 'DELETE'
        }).then(() => fetchMenu());
    }

    function openCommentModal(dishId) {
        const modal = document.getElementById("commentModal");
        const commentsContainer = document.getElementById("commentsContainer");
        const newCommentInput = document.getElementById("newComment");
        const commentForm = document.getElementById("commentForm");
        commentsContainer.innerHTML = '';
    
        if (currentUser) {
            registrationMessage.style.display = "none";
            commentForm.style.display = "block";
        } else {
            registrationMessage.style.display = "block";
            commentForm.style.display = "none";
        }
    
        commentsContainer.innerHTML = '';

        fetch(`https://eu-cluster-west-01.k8s.cleardb.net/comments/${dishId}`)
            .then(response => response.json())
            .then(comments => {
                comments.forEach(comment => {
                    const commentDiv = document.createElement("div");
                    commentDiv.classList.add("comment");
                    commentDiv.innerHTML = `
                        <strong>${comment.username}</strong>
                        <p>${comment.comment}</p>`;
                    
                    if (currentUser && currentUser.role === "admin") {
                        const deleteButton = document.createElement("button");
                        deleteButton.textContent = "Delete";
                        deleteButton.classList.add("delete-comment");
                        deleteButton.addEventListener("click", function() {
                            deleteComment(comment.id, dishId);
                        });
                        commentDiv.appendChild(deleteButton);
                    }
    
                    commentsContainer.appendChild(commentDiv);
                });
    
                if (currentUser) {
                    commentForm.style.display = "block";
                    commentForm.onsubmit = function(event) {
                        event.preventDefault();
                        
                        const newComment = document.getElementById("newComment").value;
                        postComment(dishId, newComment);
                        newCommentInput.value = "";
                    };
                } else {
                    commentForm.style.display = "none";
                }
            });
    
        modal.style.display = "block";
    }
    

    function deleteComment(commentId, dishId) {
        fetch(`https://eu-cluster-west-01.k8s.cleardb.net/comments/${commentId}`, {
            method: 'DELETE'
        })
        .then(() => {
            fetch(`https://eu-cluster-west-01.k8s.cleardb.net/comments/reorder`) 
            .then(() => openCommentModal(dishId)); 
        });
    }
    
    
    
    function postComment(dishId, comment) {
        fetch('https://eu-cluster-west-01.k8s.cleardb.net/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                dish_id: dishId,
                comment: comment
            })
        }).then(() => {
            openCommentModal(dishId); 
        });
    }

    document.getElementById("commentModalClose").addEventListener("click", function() {
        const modal = document.getElementById("commentModal");
        modal.style.display = "none";
    });

    function openEditModal(product) {
        const modal = document.getElementById("editModal");
        const form = document.getElementById("editForm");

        form.elements["dishName"].value = product.name;
        form.elements["dishPrice"].value = product.price;
        form.elements["dishImage"].value = product.image;
        form.elements["dishDescription"].value = product.description;
        form.elements["dishWeight"].value = product.weight;

        const dishCategorySelect = form.elements["dishCategory"];
        dishCategorySelect.innerHTML = '';

        fetch('https://eu-cluster-west-01.k8s.cleardb.net/categories')
            .then(response => response.json())
            .then(categories => {
                categories.forEach(category => {
                    const option = document.createElement("option");
                    option.value = category.id;
                    option.textContent = category.name;
                    if (category.id === product.category_id) {
                        option.selected = true;
                    }
                    dishCategorySelect.appendChild(option);
                });
            });

        form.dataset.productId = product.id;
        modal.style.display = "block";
    }

    function closeEditModal() {
        const modal = document.getElementById("editModal");
        modal.style.display = "none";
    }

    function updateProduct(event) {
        event.preventDefault();

        const form = event.target;
        const id = form.dataset.productId;

        const updatedProduct = {
            name: form.elements["dishName"].value,
            price: form.elements["dishPrice"].value,
            image: form.elements["dishImage"].value,
            description: form.elements["dishDescription"].value,
            weight: form.elements["dishWeight"].value,
            category_id: form.elements["dishCategory"].value
        };

        fetch(`https://eu-cluster-west-01.k8s.cleardb.net/menu/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        }).then(() => {
            closeEditModal();
            fetchMenu();
        });
    }

    function setupNavbar() {
        const adminLink = document.getElementById("adminLink");
        const logoutLink = document.getElementById("logoutLink");
        const loginLink = document.getElementById("loginLink");

        if (logoutLink && adminLink) {
            if (currentUser) {
                loginLink.style.display = "none";
                logoutLink.style.display = "inline";
                if (currentUser.role === "admin") {
                    adminLink.style.display = "inline";
                }
            } else {
                loginLink.style.display = "inline";
                logoutLink.style.display = "none";
                adminLink.style.display = "none";
            }

            logoutLink.addEventListener("click", function() {
                localStorage.removeItem("currentUser");
                window.location.href = "index.html";
            });
        }

        if (adminLink) {
            adminLink.addEventListener("click", function(event) {
                event.preventDefault();
                if (currentUser && currentUser.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    alert("Access denied. Admins only.");
                }
            });
        }
    }

    function filterMenu() 
    {
        const filterInput = document.getElementById("productFilter");
        filterInput.addEventListener("input", function() 
        {
            const filterValue = filterInput.value.toLowerCase();
            const menuItems = document.querySelectorAll(".menu-item");
            menuItems.forEach(item => {
                const name = item.querySelector("h4").textContent.toLowerCase();
                if (name.includes(filterValue)) {
                    item.style.display = "";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    document.getElementById("footer").addEventListener("mouseover", function() {
        this.style.height = "150px"; 
    });
    
    document.getElementById("footer").addEventListener("mouseout", function() {
        this.style.height = "0";
    });
    

    document.getElementById("editModalClose").addEventListener("click", closeEditModal);
    document.getElementById("editForm").addEventListener("submit", updateProduct);

    fetchMenu();
    setupNavbar();
    filterMenu();
});
