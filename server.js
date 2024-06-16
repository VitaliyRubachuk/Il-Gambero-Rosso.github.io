require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const dbcheck = process.env.DBCHECK;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createPool({
  host: 'eu-cluster-west-01.k8s.cleardb.net',
  user: process.env.CLEARDB_DATABASE_USER,
  password: process.env.CLEARDB_DATABASE_PASSWORD,
  database: process.env.CLEARDB_DATABASE_NAME,
  connectionLimit: 30,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('MySQL Connected...');

    const createTables = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        additionalRequests TEXT,
        orderedItemsIds TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image TEXT,
        description TEXT,
        weight INT,
        category_id INT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        dish_id INT NOT NULL,
        comment TEXT NOT NULL,
        FOREIGN KEY (dish_id) REFERENCES menu(id)
      );
    `;

    const queries = createTables.split(';').filter(q => q.trim() !== '');

    queries.forEach(query => {
      connection.query(query, (err, result) => {
        if (err) throw err;
        console.log('Table created or already exists');
      });
    });

    const insertAdminUser = `
      INSERT INTO users (username, password, role)
      SELECT 'admin', ?, 'admin' FROM DUAL
      WHERE NOT EXISTS (
          SELECT username FROM users WHERE username = 'admin'
      ) LIMIT 1;
    `;

    const hashPassword = crypto.createHash('sha256').update(dbcheck).digest('hex');

    connection.query(insertAdminUser, [hashPassword], (err, result) => {
      if (err) throw err;
      console.log('Admin user inserted if not exists');
    });

    connection.release();
  }
});
app.use(express.static(path.join(__dirname, 'rest')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'images')));

const cssPath = path.join(__dirname, 'styles.css');
const mainPath = path.join(__dirname, 'main.js');
const orderPath = path.join(__dirname, 'order.js');
const authPath = path.join(__dirname, 'auth.js');
const adminordersPath = path.join(__dirname, 'admin-orders.js');
const adminPath = path.join(__dirname, 'admin.js');
const logoPath = path.join(__dirname, 'logo.png');
const FPath = path.join(__dirname, 'images/facebook-icon.png');
const IPath = path.join(__dirname, 'images/instagram-icon.png');
const TPath = path.join(__dirname, 'images/telegram-icon.png');

app.get('/styles.css', (req, res) => {
  res.sendFile(cssPath);
});

app.get('/facebook-icon.png', (req, res) => {
  res.sendFile(FPath);
});

app.get('/instagram-icon.png', (req, res) => {
  res.sendFile(IPath);
});

app.get('/telegram-icon.png', (req, res) => {
  res.sendFile(TPath);
});

app.get('/logo.png', (req, res) => {
  res.sendFile(logoPath);
});

app.get('/main.js', (req, res) => {
  res.sendFile(mainPath);
});

app.get('/order.js', (req, res) => {
  res.sendFile(orderPath);
});

app.get('/auth.js', (req, res) => {
  res.sendFile(authPath);
});

app.get('/admin-orders.js', (req, res) => {
  res.sendFile(adminordersPath);
});

app.get('/admin.js', (req, res) => {
  res.sendFile(adminPath);
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-orders.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});


app.get('/order.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'order.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});



app.get('/comments/:dish_id', (req, res) => {
  const { dish_id } = req.params;
  db.query('SELECT * FROM comments WHERE dish_id = ?', [dish_id], (err, results) => {
    if (err) {
      console.error('Error getting comments:', err);
      res.status(500).json({ success: false, message: 'Failed to get comments' });
    } else {
      res.json(results);
    }
  });
});

app.post('/comments', (req, res) => {
  const { username, dish_id, comment } = req.body;
  db.query('INSERT INTO comments (username, dish_id, comment) VALUES (?, ?, ?)', [username, dish_id, comment], (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      res.status(500).json({ success: false, message: 'Failed to add comment' });
    } else {
      res.json({ success: true });
    }
  });
});

const reorderIDs = (table, callback) => {
  db.query(`SET @count = 0`, err => {
    if (err) throw err;
    db.query(`UPDATE ${table} SET id = @count := @count + 1`, err => {
      if (err) throw err;
      db.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`, err => {
        if (err) throw err;
        callback();
      });
    });
  });
};

app.get('/orders', (req, res) => {
  db.query('SELECT * FROM orders', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM orders WHERE id = ?', [id], (err, result) => {
    if (err) throw err;
    reorderIDs('orders', () => {
      res.json({ success: true });
    });
  });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({ success: false, message: 'Username already taken!' });
      } else {
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
          if (err) throw err;
          res.json({ success: true });
        });
      }
    });
  } catch (error) {
    console.error('Error while hashing password:', error);
    res.status(500).json({ success: false, message: 'Failed to register user', error: error.message });
  }
});

app.post('/orders', (req, res) => {
  const { username, additionalRequests, orderedItemsIds } = req.body;

  db.query('INSERT INTO orders (username, additionalRequests, orderedItemsIds) VALUES (?, ?, ?)', 
      [username, additionalRequests, orderedItemsIds], (err, result) => {
    if (err) {
      console.error('Error while adding order:', err);
      return res.status(500).json({ success: false, message: 'Failed to add order', error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const user = results[0];
      try {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        if (hashedPassword === user.password) {
          res.json({ success: true, user });
        } else {
          res.json({ success: false, message: 'Invalid username or password!' });
        }
      } catch (error) {
        console.error('Error while comparing passwords:', error);
        res.status(500).json({ success: false, message: 'Failed to authenticate', error: error.message });
      }
    } else {
      res.json({ success: false, message: 'Invalid username or password!' });
    }
  });
});

app.post('/categories', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
    if (err) throw err;
    res.json({ success: true });
  });
});

app.get('/categories', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/menu', (req, res) => {
  const { name, price, image, description, weight, category_id } = req.body;
  db.query('INSERT INTO menu (name, price, image, description, weight, category_id) VALUES (?, ?, ?, ?, ?, ?)', [name, price, image, description, weight, category_id], (err, result) => {
    if (err) {
      console.error('Error while adding menu item:', err);
      return res.status(500).json({ success: false, message: 'Failed to add menu item', error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/menu', (req, res) => {
  db.query('SELECT menu.*, categories.name as category FROM menu JOIN categories ON menu.category_id = categories.id', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.delete('/comments/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM comments WHERE id = ?', [id], (err, result) => {
    if (err) throw err;
    db.query(`ALTER TABLE comments AUTO_INCREMENT = 1`, err => {
      if (err) throw err;
      res.json({ success: true });
    });
  });
});

app.delete('/menu/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM menu WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        reorderIDs('menu', () => {
            res.json({ success: true });
        });
    });
});

app.delete('/categories/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM categories WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        reorderIDs('categories', () => {
            res.json({ success: true });
        });
    });
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        reorderIDs('users', () => {
            res.json({ success: true });
        });
    });
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.put('/menu/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, image, description, weight, category_id } = req.body;
    console.log('Update Request Body:', req.body);

    db.query('UPDATE menu SET name = ?, price = ?, image = ?, description = ?, weight = ?, category_id = ? WHERE id = ?', [name, price, image, description, weight, category_id, id], (err, result) => {
        if (err) {
            console.error('Error while updating menu item:', err);
            return res.status(500).json({ success: false, message: 'Failed to update menu item', error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
  
  // Глобальний обробник помилок
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });
  

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

