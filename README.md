# CloudMart — E-Commerce Practice Project

A simple full-stack e-commerce app for DevOps practice.

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, Tailwind CSS |
| HTTP      | Axios (frontend → backend)              |
| Backend   | Node.js, Express                        |
| Data      | In-memory (no DB — ready to swap in)    |

## Project Structure

```
CloudMart/
├── backend/
│   ├── data/
│   │   └── products.js      # In-memory product list
│   ├── routes/
│   │   ├── products.js      # GET /api/products, GET /api/products/:id
│   │   └── cart.js          # GET/POST/PUT/DELETE /api/cart
│   ├── server.js            # Express entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js     # Shared Axios instance
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProductCard.jsx
    │   │   └── CartItem.jsx
    │   ├── context/
    │   │   └── CartContext.jsx  # Global cart state via React Context
    │   ├── pages/
    │   │   ├── Home.jsx         # Product grid with category filter
    │   │   ├── ProductDetails.jsx
    │   │   └── Cart.jsx
    │   ├── App.jsx          # Router + layout
    │   └── main.jsx         # React entry point
    ├── vite.config.js       # Dev proxy → backend
    └── package.json
```

## Running Locally

### 1. Start the backend
```bash
cd backend
npm install
npm run dev      # uses nodemon for auto-restart
# Server: http://localhost:5000
```

### 2. Start the frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

## API Endpoints

| Method | Endpoint               | Description                   |
|--------|------------------------|-------------------------------|
| GET    | /api/products          | List all products             |
| GET    | /api/products/:id      | Get single product            |
| GET    | /api/cart              | Get current cart              |
| POST   | /api/cart              | Add item `{ productId, quantity }` |
| PUT    | /api/cart/:productId   | Update quantity               |
| DELETE | /api/cart/:productId   | Remove item                   |
| GET    | /health                | Health check                  |

## Next Steps (DevOps practice ideas)

- Add a Dockerfile for each service
- Add a `docker-compose.yml` to run both together
- Add a CI/CD pipeline (GitHub Actions)
- Swap in-memory data for MongoDB or PostgreSQL
- Deploy to a cloud provider (AWS, GCP, Azure)
