# Grocery Admin Panel Backend

This is the backend API for the Grocery Admin Panel, providing endpoints for Dashboard, POS, and Order Management.

## Features

### Authentication
- Login with email and password
- Profile management
- Password change functionality

### Dashboard
- Overview statistics (products, orders, stores, customers)
- Sales data visualization
- User statistics
- Top performing items and stores
- User listing with pagination

### POS (Point of Sale)
- Store selection
- Product listing with search and filters
- Customer management
- Order calculation
- Order creation

### Order Management
- Order listing with advanced filters
- Order details view
- Order status updates
- Order export functionality

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` file

3. Create required directories:
   ```bash
   mkdir uploads
   ```

4. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Documentation

### Authentication APIs
- POST /api/auth/login - Login with email and password
- GET /api/auth/profile - Get current user profile
- PUT /api/auth/profile - Update user profile
- PUT /api/auth/change-password - Change password

### Dashboard APIs
- GET /api/dashboard/statistics - Get dashboard statistics
- GET /api/dashboard/users - Get user list

### POS APIs
- GET /api/pos/stores - Get stores list
- GET /api/pos/products/:storeId - Get products by store
- POST /api/pos/customer - Get or create customer
- POST /api/pos/calculate-total - Calculate order total
- POST /api/pos/order - Create new order

### Order Management APIs
- GET /api/orders - Get orders list with filtering
- GET /api/orders/:id - Get order details
- PUT /api/orders/:id/status - Update order status
- GET /api/orders/export - Export orders

## Security Features

- JWT-based authentication
- Input validation
- File upload validation
- Error handling
- Rate limiting (TODO)
- Request logging (TODO)

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Express Validator for input validation
- Multer for file uploads

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
