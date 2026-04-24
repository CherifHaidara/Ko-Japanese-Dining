# Ko Japanese Dining

A full-stack web application built for Ko Japanese Dining, a Japanese restaurant located in Washington, DC. This started as a class project but is being built for real use by the restaurant once it's complete.

The app lets customers browse the menu, place pickup orders, make reservations, leave reviews, and manage their account. Restaurant staff get a dedicated admin dashboard to manage orders, reservations, and the menu.

---

## What's inside

**For customers**
- Browse the full menu (Dinner, Lunch, Brunch) with food photos
- Add items to a cart and place pickup orders
- Track order status in real time
- Make and manage reservations
- Leave star ratings and reviews on menu items
- Create an account, update your profile, and view order history
- Earn and redeem loyalty points

**For the restaurant**
- Admin dashboard to view and update incoming orders
- Manage reservations
- Edit menu items, prices, and featured dishes
- View sales analytics and order trends
- Automatic email confirmations sent to customers for orders and reservations

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Recharts |
| Backend | Node.js, Express |
| Database | MySQL (hosted on Railway) |
| Auth | JWT, bcryptjs |
| Email | Nodemailer |
| File uploads | Multer |

---

## Getting started

### Prerequisites
- Node.js v18+
- MySQL (local) or a Railway database connection
- A Gmail account for sending emails (or update the mailer config)

### 1. Clone the repo

```bash
git clone https://github.com/CherifHaidara/Ko-Japanese-Dining.git
cd Ko-Japanese-Dining
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```
PORT=5050
NODE_ENV=development

DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=ko_dining

JWT_SECRET=your_jwt_secret

ADMIN_PASSWORD=your_admin_password

EMAIL=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

> If you're on the team, ask for the shared `.env` with the Railway credentials so everyone connects to the same database.

### 3. Install dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### 4. Set up the database

Run the SQL setup files to create the tables:

```bash
mysql -u root -p ko_dining < database/menu_setup.sql
```

### 5. Start the app

From the root directory:

```bash
# Start backend (port 5050)
npm start

# In a separate terminal, start the frontend (port 3000)
cd client
npm start
```

The React app proxies API requests to `http://localhost:5050` automatically.

---

## Project structure

```
Ko-Japanese-Dining/
├── client/                 # React frontend
│   ├── public/
│   │   └── images/         # Menu food photos
│   └── src/
│       ├── components/     # Reusable components (Cart, Navbar, etc.)
│       ├── context/        # Auth and Cart context providers
│       ├── pages/          # All page components
│       └── utils/          # API helpers and auth utilities
├── database/               # DB connection and SQL setup files
├── middleware/             # Auth and admin guard middleware
├── routes/                 # All Express API routes
├── utils/                  # Mailer utility
├── index.js                # Express app entry point
└── .env                    # Environment variables (not committed)
```

---

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new customer |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/admin-login` | Admin login |
| GET | `/api/menu/full` | Get full menu by type |
| POST | `/api/checkout` | Place a pickup order |
| GET | `/api/orders/:id` | Get order by ID |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/reservations/` | Make a reservation |
| GET | `/api/reservations/admin` | Get all reservations (admin) |
| GET | `/api/users/me` | Get current user profile |
| POST | `/api/reviews/` | Submit a review |
| GET | `/api/admin/analytics` | Get sales analytics |

---

## Team

Built by students at UMBC as part of CMSC 447 — Software Engineering.

---

## Notes

- The `.env` file is never committed. Don't push it.
- The app is currently under active development. Some features may be incomplete.
- Loyalty points system is built but not yet enabled on the live routes.
