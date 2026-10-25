# Stock Inventory Dashboard — React + Django REST + MySQL

This project recreates the supplied inventory screenshots as a three-step dashboard:
1. Stock count and valuation
2. Stock movement history
3. Smart Features

## Requirements
- Python 3.10+
- Node.js 18+
- MySQL 8+

## 1. Create the MySQL database
Run in MySQL Workbench:

```sql
CREATE DATABASE stock_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Backend setup (Django)
Open a terminal in `backend/`:

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and update the MySQL username/password. Example:

```env
DB_NAME=stock_inventory
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

Then run:

```bash
python manage.py makemigrations inventory
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API runs at `http://127.0.0.1:8000/api/`.

## 3. Frontend setup (React + Vite)
Open another terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Notes
- The frontend has demo fallback data if the backend is not running, so you can inspect the design first.
- The backend uses Django REST Framework and `mysqlclient` for MySQL.
- For Windows, if `mysqlclient` installation fails, install a supported Microsoft C++ Build Tools version or use a Python version supported by the installed `mysqlclient` wheel.
