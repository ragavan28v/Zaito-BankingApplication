# Zaito - Modern Banking System

A robust, full-stack banking application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- User Authentication (Signup/Login)
- Account Management & Settings
- Balance Checking
- Fund Transfers (with PIN security)
- Transaction History
- **Group Expenses** (split, custom/equal, force settle with confirmation)
- Modern, Responsive, and Mobile-Friendly UI/UX
- PIN Setup and Enforcement
- Secure, Real-World Banking Logic
- Consistent, accessible modals and overlays

## Tech Stack

- **Frontend:** React.js with modular, modern CSS
- **Backend:** Node.js with Express.js
- **Database:** MongoDB (Atlas recommended)
- **Authentication:** JWT (JSON Web Tokens)

## Project Structure

```
bankingSystem/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── styles/         # CSS files (modular, per-feature)
│       ├── context/        # React context
│       └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── middleware/        # Custom middleware
│   ├── models/            # Database models
│   └── routes/            # API routes
└── README.md
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/ragavan28v/Zaito-BankingApplication.git
   cd Zaito-BankingApplication
   ```
2. **Install dependencies:**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```
3. **Create a .env file in the server directory:**
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=production
   ```
4. **Build the frontend for production:**
   ```bash
   cd ../client
   npm run build
   ```
5. **Start the backend (serves both API and frontend):**
   ```bash
   cd ../server
   $env:NODE_ENV="production"; node server.js   # PowerShell
   # or
   set NODE_ENV=production && node server.js      # CMD
   ```
6. **Visit:** [http://localhost:5000](http://localhost:5000)

## Group Expenses Feature
- Create group expenses with custom or equal split.
- Members can pay their share securely with PIN.
- **Force Settle:** The creator can settle an expense at any time, even if not all members have paid, after confirming in a modal overlay (matches the app's PIN modal style).
- Status and actions are always clear and mobile-friendly.

## Deployment (Render.com Example)

1. Push your code to GitHub ([repo link](https://github.com/ragavan28v/Zaito-BankingApplication.git)).
2. Create a free MongoDB Atlas cluster and get your connection string.
3. Sign up at [Render.com](https://render.com/), create a new Web Service, and connect your repo.
4. Set the root directory to `server`.
5. **Build command:**
   ```bash
   cd ../client && npm install && npm run build && cd ../server && npm install
   ```
6. **Start command:**
   ```bash
   node server.js
   ```
7. **Environment variables:**
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT=5000`
8. Add a custom domain in Render settings and follow DNS instructions for HTTPS.

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- PUT /api/auth/pin - Update PIN
- PUT /api/auth/pin/setup - Set initial PIN

### Account
- GET /api/accounts/balance - Get account balance
- POST /api/accounts/transfer - Transfer funds
- GET /api/accounts/transactions - Get transaction history

### Group Expenses
- POST /api/split/expenses - Create group expense
- POST /api/split/expenses/:id/pay - Pay your share (with PIN)
- POST /api/split/expenses/:id/settle - Settle (force or normal)

## Security Features

- JWT Authentication
- Password & PIN Hashing
- Protected Routes
- Input Validation
- Error Handling
- HTTPS (with Render or custom domain)

---

**Zaito** is a modern, secure, and user-friendly banking platform. For more details, see the code or open an issue! 