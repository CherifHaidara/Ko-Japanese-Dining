# Ko Japanese Dining — Setup

This is how you get the project running on your machine. Make sure you do everything in order.

---

## What You Need

- [Node.js](https://nodejs.org) — download the LTS version
- [MySQL](https://dev.mysql.com/downloads/mysql/) — version 8 or higher
- [Git](https://git-scm.com)

---

## 1. Clone the Repo

```bash
git clone https://github.com/CherifHaidara/Ko-Japanese-Dining.git
cd Ko-Japanese-Dining
```

---

## 2. Install Dependencies

In the root folder:

```bash
npm install
```

Then go into the client folder and do the same:

```bash
cd client
npm install
cd ..
```

---

## 3. Create Your .env File

Make a file called `.env` in the root of the project and paste this in:

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ko_dining
```

Change `your_mysql_password` to whatever password you set when you installed MySQL. If you didn't set one, just leave it blank.

---

## 4. Set Up the Database

Run these in your terminal. Swap in your actual MySQL password where it says `your_mysql_password`.

Create the database first:
```bash
mysql -u root -pyour_mysql_password -e "CREATE DATABASE IF NOT EXISTS ko_dining;"
```

Then run the two setup files:
```bash
mysql -u root -pyour_mysql_password ko_dining < database/menu_setup.sql
mysql -u root -pyour_mysql_password ko_dining < database/orders_setup.sql
```

If you see a warning about the password being insecure, just ignore it — it still works. If you get a duplicate entry error on `menu_setup.sql`, that just means the data is already there, so move on to `orders_setup.sql`.

---

## 5. Start the Project

You need two terminals running at the same time.

**Terminal 1 — start the backend** (run this from the root folder):
```bash
npm start
```
It should say `Server running on port 5000` if everything is working.

**Terminal 2 — start the frontend** (run this from the client folder):
```bash
cd client
npm start
```
The site will open at `http://localhost:3000`

---

## Admin Dashboard

Go to `http://localhost:3000/admin/login` and use the password `Admin1234`.

---

## If Something Goes Wrong

**npm start says command not found** — Node.js is not installed. Get it at [nodejs.org](https://nodejs.org).

**Proxy error or can't connect to server** — The backend isn't running. Open a separate terminal and run `npm start` from the root folder.

**Failed to load orders** — MySQL isn't running or your `.env` credentials are wrong. Double check Step 3 and Step 4.

**Port 3000 is already in use** — Just press `Y` when it asks if you want to use a different port.
