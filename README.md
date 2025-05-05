---

# Full Stack App — Flask API + React Frontend

A robust, full-stack web application built with a **Flask RESTful API** backend and a modern **React/TypeScript** frontend using **Tailwind CSS** and **shadcn/ui** for sleek, responsive design.

This project is structured with clear separation of concerns, supporting scalable development and easy maintenance.

> 📺 **Live preview:** [https://kazihub.co.ke](https://kazihub.co.ke)

---

## 🌟 Features

### Backend (Flask)

✅ Flask factory pattern for flexible app setup
✅ SQLAlchemy ORM + raw SQL support
✅ API versioning with Blueprints
✅ Environment-specific configs (.env)
✅ Full CRUD for users resource
✅ Testing setup with pytest

📄 **Backend README:** [View here](https://github.com/Byekibe/library-management-system-project/blob/main/backend/README.md)

---

### Frontend (React)

✅ TypeScript + React app
✅ Tailwind CSS + shadcn/ui components
✅ Axios integration for API requests
✅ Modern UI patterns, reusable components
✅ React Router for client-side routing
✅ State management using React hooks (or add Zustand/Redux if needed)

📄 **Frontend README:** [View here](https://github.com/Byekibe/library-management-system-project/blob/main/client/README.md)

---

## 🏗️ Project Structure

```
root/
├── backend/ (my_flask_api)
│   ├── app/
│   ├── config.py
│   ├── run.py
│   ├── requirements.txt
│   └── tests/
└── frontend/ (my_frontend)
    ├── src/
    ├── public/
    ├── tailwind.config.ts
    ├── package.json
    └── tsconfig.json
```

Would you like me to also make the backend and frontend READMEs **relative links** (for when browsing directly in the repo)?


📄 **Detailed README for each folder:**

* [Backend README](https://github.com/Byekibe/library-management-system-project/blob/main/backend/README.md)
* [Frontend README](https://github.com/Byekibe/library-management-system-project/blob/main/client/README.md)

---

## 🚀 Getting Started

### Prerequisites

* Python 3.8+
* Node.js 18+ & npm
* PostgreSQL or MySQL database

---

### 🐍 Backend Setup (Flask)

1. Navigate to backend:

   ```
   cd backend
   ```

2. Create and activate a virtual environment:

   ```
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Copy and configure environment:

   ```
   cp .env.example .env
   ```

5. Initialize the database:

   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. Run the API:

   ```
   python3 run.py
   ```

   API runs at: **[http://localhost:5000](http://localhost:5000)**

---

### ⚛️ Frontend Setup (React)

1. Navigate to frontend:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Configure API base URL (in `.env` or Axios setup):

   ```
   VITE_BASE_URL=http://localhost:5000/api/v1
   ```

4. Run the React app:

   ```
   npm run dev
   ```

   App runs at: **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Development Scripts

### Backend

* Run dev server:

  ```
  python3 run.py
  ```
* Run tests:

  ```
  pytest
  ```
* Check test coverage:

  ```
  pytest --cov=app tests/
  ```

### Frontend

* Run dev server:

  ```
  npm run dev
  ```
* Build for production:

  ```
  npm run build
  ```
* Run frontend tests (if set up):

  ```
  npm run test
  ```

---

## 🔌 API Endpoints

Example Users resource:

* `GET /api/v1/users` — List all users
* `GET /api/v1/users/<id>` — Get user by ID
* `POST /api/v1/users` — Create new user
* `PUT /api/v1/users/<id>` — Update user
* `DELETE /api/v1/users/<id>` — Delete user

---

## 🌍 Deployment

This project is deployed and live at: **[https://kazihub.co.ke](https://kazihub.co.ke)**

### Backend (Production)

1. Update `.env`:

   ```
   ```

FLASK\_APP=run.py
FLASK\_ENV=development
SECRET\_KEY=your-secret-key-for-development

# DATABASE\_URL=postgresql+psycopg2://username\:password\@host\:port/database\_name

# Uncomment the following line if you want to use MySQL instead of PostgreSQL

DATABASE\_URL=mysql+pymysql://user\:password\@host\:port/database\_name

```

2. Run with Gunicorn:

```

gunicorn "app\:create\_app('production')" --bind 0.0.0.0:8000

```

### Frontend (Production)

1. Build static files:

```

npm run build

```

2. Serve with:

* Vercel, Netlify, or static file host  
* Or serve alongside backend using a reverse proxy (e.g., Nginx)

---

## ⚙️ Technologies Used

| Backend       | Frontend           |
| ------------- | ------------------ |
| Flask         | React + TypeScript |
| SQLAlchemy    | Tailwind CSS       |
| Marshmallow   | shadcn/ui          |
| pytest        | React Router       |
| Flask-Migrate | RTK Query          |

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

