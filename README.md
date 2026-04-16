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

users
├── id (PK)
├── full_name
├── email (unique)
├── password (hashed)
├── phone_number (unique)
├── bvn
├── is_active
└── created_at
wallets
├── id (PK)
├── user_id (FK → users.id)
├── balance
└── created_at
transactions
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

**Why KnexJS over a full ORM like TypeORM?**
Knex gives fine-grained control over SQL queries while still providing 
a clean JavaScript interface. For a financial application where 
precise query control matters, this is preferable to a heavy ORM 
that abstracts too much.

**Why separate debit/credit transactions for transfers?**
Each wallet maintains its own complete transaction history. 
When a transfer occurs, two records are created — a debit on the 
sender's wallet and a credit on the recipient's wallet. 
This mirrors how real banking systems work and ensures each 
wallet's history is self-contained and auditable.

**Why hash passwords with bcryptjs?**
Passwords are never stored as plain text. bcrypt hash the passwords 
automatically, meaning even identical passwords produce different 
hashes, protecting against rainbow table attacks.

**Karma blacklist check placement**
The check happens at registration, not login. 
This is intentional — a blacklisted user should never 
get an account in the first place.

<img width="1620" height="673" alt="database_schema_sanpshot" src="https://github.com/user-attachments/assets/f410980f-b9ce-4602-972b-eb576ebd5b65" />
