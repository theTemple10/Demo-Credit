# Demo Credit

A mobile lending app wallet service built with Node.js, TypeScript, KnexJS, and MySQL.

## Live URL
https://victor-akinremi-lendsqr-be-test.up.railway.app/

## Table of Contents
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [E-R Diagram](#e-r-diagram)
- [Endpoints](#endpoints)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)

## About
Demo Credit is an MVP wallet service that allows users to create accounts, fund their wallets, transfer funds to other users, and withdraw funds. Users on the Lendsqr Adjutor Karma blacklist are blocked from onboarding.

## Features
- User account creation with Karma blacklist check
- Wallet funding
- Peer-to-peer fund transfers
- Wallet withdrawal
- Transaction history
- Faux token-based authentication

## Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: KnexJS
- **Database**: MySQL
- **Testing**: Jest + Supertest
- **Deployment**: Railway

## Architecture

The project follows a layered architecture:

src/

├── controllers/      # Handle HTTP request/response logic

├── models/           # Database query functions per table

├── routes/           # URL and HTTP method definitions

├── middlewares/      # Authentication checks

├── services/         # External service integrations (Adjutor Karma)

├── database/

│   ├── migrations/   # Database schema version control

│   └── knexfile.ts   # Database configuration

└── utils/            # Shared helper functions

## E-R Diagram

**users**

├── id (PK)

├── full_name

├── email (unique)

├── password (hashed)

├── phone_number (unique)

├── bvn

├── is_active

└── created_at

**wallets**

├── id (PK)

├── user_id (FK → users.id)

├── balance

└── created_at

**transactions**

├── id (PK)

├── wallet_id (FK → wallets.id)

├── type (credit | debit)

├── amount

├── reference (unique)

├── status (pending | successful | failed)

├── description

└── created_at


## Endpoints

#### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/users/register | Create a new account | No |
| POST | /api/users/login | Login to account | No |
| GET | /api/users/profile | Get user profile | Yes |

#### Wallet
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/wallet/fund | Fund wallet | Yes |
| POST | /api/wallet/transfer | Transfer to another user | Yes |
| POST | /api/wallet/withdraw | Withdraw from wallet | Yes |
| GET | /api/wallet/transactions | Get transaction history | Yes |


## Getting Started

### Prerequisites
- Node.js >= 18
- MySQL

### Installation

```bash
# Clone the repository
git clone https://github.com/theTemple10/demo-credit.git
cd demo-credit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## Running Tests

```bash
npm run test
```

Tests use a separate `demo_credit_test` database. 
Make sure it exists before running tests:
```sql
CREATE DATABASE demo_credit_test;
```

## Design Decisions

**Automatic wallet creation on registration**
A user without a wallet is an incomplete account in this system. Rather than requiring a separate API call to create a wallet, the registration endpoint automatically creates a wallet for every new user. This ensures data integrity and simplifies the client integration.

**Two transaction records per transfer**
When a transfer occurs, two records are created — a debit on the sender's wallet and a credit on the recipient's wallet. This mirrors how real banking systems work. Each wallet maintains a complete, self-contained transaction history. To audit what happened to any wallet, you only need to query that wallet's transactions — no cross-referencing required.

**Database transaction scoping on all write operations**
Every operation that writes to the database (fund, transfer, withdraw) is wrapped in a database transaction using Knex's transaction API. This means if anything fails midway — for example, the server crashes after debiting the sender but before crediting the recipient — the entire operation rolls back. No partial states, no inconsistent balances.

**Karma blacklist check at registration, not login**
The check happens at the point of account creation. A blacklisted user should never receive an account. Checking at login would mean they already have an account and data in the system, which is not desirable.

**Faux token authentication**
The assessment permitted faux token authentication. The implementation returns the user's database ID as the token on login. Protected routes extract this ID from the Authorization header and load the user from the database. In a production system this would be replaced with JWT tokens with expiry, refresh token rotation, and proper signing secrets.


## Known Limitations

- Authentication uses a faux token (user ID) as specified. Not suitable for production.

- No rate limiting — a real deployment would need protection against repeated requests.

- No pagination on transaction history — for users with thousands of transactions this   endpoint would become slow.

- No idempotency keys on funding/transfer — a network retry could potentially create duplicate transactions.

<!-- <img width="1620" height="673" alt="database_schema_sanpshot" src="https://github.com/user-attachments/assets/f410980f-b9ce-4602-972b-eb576ebd5b65" /> -->
