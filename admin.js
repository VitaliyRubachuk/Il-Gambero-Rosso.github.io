document.addEventListener("DOMContentLoaded", function() 
{
    const menuForm = document.getElementById("menuForm");
    const categoryForm = document.getElementById("categoryForm");

    function fetchCategories() {
        fetch('https://il-gambero-rosso-github-io.onrender.com/categories')
            .then(response => response.json())
            .then(categories => {
                const categorySelect = document.getElementById("dishCategory");
                categorySelect.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement("option");
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching categories:', error));
    }

    function fetchMenu() {
        fetch('https://il-gambero-rosso-github-io.onrender.com/menu')
            .then(response => response.json())
            .then(menu => {
                const menuList = document.getElementById("menuList");
                menuList.innerHTML = '';
                menu.forEach(item => {
                    const menuItem = document.createElement("div");
                    menuItem.classList.add("menu-item");
                    menuItem.innerHTML = `
                        <h4>${item.name}</h4>
                        <p>Ціна: ${item.price} грн.</p>
                        <p>Вага: ${item.weight} г.</p>
                        <p>${item.description}</p>
                        <img src="${item.image}" alt="${item.name}">
                    `;
                    menuList.appendChild(menuItem);
                });
            })
            .catch(error => console.error('Error fetching menu:', error));
    }

    menuForm.addEventListener("submit", function(event) 
    {
        event.preventDefault();
        const dishName = document.getElementById("dishName").value;
        const dishPrice = document.getElementById("dishPrice").value;
        const dishImage = document.getElementById("dishImage").value;
        const dishDescription = document.getElementById("dishDescription").value;
        const dishWeight = document.getElementById("dishWeight").value;
        const dishCategory = document.getElementById("dishCategory").value;

        fetch('https://il-gambero-rosso-github-io.onrender.com/menu', 
            {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: dishName,
                price: dishPrice,
                image: dishImage,
                description: dishDescription,
                weight: dishWeight,
                category_id: dishCategory
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message) });
            }
            return response.json();
        })
        .then(() => {
            menuForm.reset();
            fetchMenu();
        })
        .catch(error => console.error('Error:', error));
    });

    categoryForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const categoryName = document.getElementById("categoryName").value;

        fetch('https://il-gambero-rosso-github-io.onrender.com/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message) });
            }
            return response.json();
        })
        .then(() => {
            categoryForm.reset();
            fetchCategories();
        })
        .catch(error => console.error('Error:', error));
    });

    
    fetchCategories();
    fetchMenu();
});
