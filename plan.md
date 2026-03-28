# Service Listing Website - Development Plan

## Project Overview
A service booking platform with an admin panel for service management and a public interface for users to browse and book services.

**Tech Stack:**
- Frontend: Next.js + TailwindCSS
- Backend: Node.js + Express
- Database: MongoDB
- Email: Nodemailer/SendGrid
- Hosting: Vercel (Frontend) + Railway (Backend)

---

## Phase 1: Project Setup (Days 1-2)

### 1.1 Frontend Setup
- [ ] Initialize Next.js project
- [ ] Install TailwindCSS
- [ ] Setup folder structure:
  - `/app` - Pages and layouts
  - `/components` - Reusable components
  - `/pages/admin` - Admin dashboard pages
  - `/public` - Static assets
  - `/styles` - Global styles
- [ ] Setup environment variables (.env.local)
- [ ] Install required packages:
  - axios (API calls)
  - next-cookies (for JWT tokens)
  - react-hook-form (forms)
  - react-hot-toast (notifications)

### 1.2 Backend Setup
- [ ] Initialize Node.js/Express project
- [ ] Install dependencies:
  - express
  - mongoose (MongoDB)
  - bcryptjs (password hashing)
  - jsonwebtoken (JWT)
  - dotenv (environment variables)
  - cors
  - nodemailer OR mailgun-js
- [ ] Setup folder structure:
  - `/models` - MongoDB schemas
  - `/routes` - API endpoints
  - `/controllers` - Business logic
  - `/middlewares` - Auth middleware
  - `/config` - Database connection
  - `/utils` - Helper functions
- [ ] Setup environment variables (.env)
- [ ] Connect to MongoDB Atlas

### 1.3 Database Setup
- [ ] Create MongoDB Atlas account
- [ ] Create database cluster
- [ ] Define MongoDB schemas:
  - User (admin) schema
  - Service listing schema
  - Booking/Inquiry schema

---

## Phase 2: Database & Models (Days 3-4)

### 2.1 Admin User Model
```
- email
- password (hashed)
- firstName
- lastName
- createdAt
```

### 2.2 Service Listing Model
```
- title
- description
- category
- price
- image (URL)
- serviceDetails
- createdBy (admin ID)
- createdAt
- updatedAt
```

### 2.3 Booking/Inquiry Model
```
- serviceName
- userName
- userEmail
- userPhone
- message
- date
- status (pending/contacted/completed)
- createdAt
```

---

## Phase 3: Backend Authentication (Days 5-6)

### 3.1 Admin Registration & Login
- [ ] POST `/api/auth/register` - Create admin account
- [ ] POST `/api/auth/login` - Login (returns JWT token)
- [ ] Middleware to verify JWT tokens
- [ ] Password hashing with bcryptjs

### 3.2 Protected Routes
- [ ] Apply JWT middleware to admin-only routes
- [ ] Test authentication flow

---

## Phase 4: Backend API Endpoints (Days 7-9)

### 4.1 Service Management (Admin Only)
- [ ] GET `/api/services` - Get all services (public)
- [ ] GET `/api/services/:id` - Get single service
- [ ] POST `/api/services` - Create service (admin only)
- [ ] PUT `/api/services/:id` - Update service (admin only)
- [ ] DELETE `/api/services/:id` - Delete service (admin only)

### 4.2 Booking/Inquiry Management
- [ ] POST `/api/bookings` - Submit booking (public)
- [ ] GET `/api/bookings` - Get all bookings (admin only)
- [ ] PUT `/api/bookings/:id` - Update booking status (admin only)
- [ ] DELETE `/api/bookings/:id` - Delete booking (admin only)

### 4.3 Email Notifications
- [ ] Setup Nodemailer/SendGrid
- [ ] Send email to admin when user submits inquiry
- [ ] Send confirmation email to user
- [ ] Send email when admin updates booking status

---

## Phase 5: Backend Contact Form (Days 10)

### 5.1 Contact/Message Endpoint
- [ ] POST `/api/contact` - Send message to admin
- [ ] Email notification to admin
- [ ] Validation and error handling

---

## Phase 6: Frontend - Public Pages (Days 11-14)

### 6.1 Home Page
- [ ] Hero section with intro
- [ ] Featured services section
- [ ] CTA buttons
- [ ] Footer

### 6.2 Services Listing Page
- [ ] Fetch services from API
- [ ] Display all services in grid/list
- [ ] Search functionality
- [ ] Category filter
- [ ] Responsive design

### 6.3 Service Detail Page
- [ ] Dynamic route `/services/[id]`
- [ ] Display full service details
- [ ] Book Service button
- [ ] Related services (optional)

### 6.4 Booking Form
- [ ] Name, email, phone input
- [ ] Message textarea
- [ ] Date/time picker (optional)
- [ ] Submit button
- [ ] Success notification
- [ ] Validation

### 6.5 Contact Page
- [ ] Contact form
- [ ] Contact information
- [ ] Map embed (optional)
- [ ] Email submission

---

## Phase 7: Frontend - Admin Panel (Days 15-18)

### 7.1 Admin Login Page
- [ ] Email and password inputs
- [ ] Form validation
- [ ] Error handling
- [ ] Redirect to dashboard on success
- [ ] Store JWT in cookies

### 7.2 Admin Dashboard Layout
- [ ] Sidebar navigation
- [ ] Header with logout
- [ ] Main content area
- [ ] Responsive mobile menu

### 7.3 Services Management Page
- [ ] Display all services in table
- [ ] Edit button for each service
- [ ] Delete button with confirmation
- [ ] Add New Service button
- [ ] Loading states

### 7.4 Add/Edit Service Modal/Page
- [ ] Form fields: title, description, category, price, image
- [ ] Form validation
- [ ] Image upload handling
- [ ] Submit to API
- [ ] Success/error messages

### 7.5 Bookings/Inquiries Page
- [ ] Display all inquiries in table
- [ ] Status column (pending/contacted/completed)
- [ ] Mark as contacted button
- [ ] Delete button
- [ ] View details button
- [ ] Sort and filter options

### 7.6 Booking Details Modal
- [ ] Display full inquiry information
- [ ] Update status
- [ ] Send email to user
- [ ] Delete inquiry

---

## Phase 8: Frontend - Additional Pages (Days 19-20)

### 8.1 About Us Page
- [ ] Company information
- [ ] Mission/Vision
- [ ] Team info (optional)

### 8.2 Privacy & Terms Pages
- [ ] Legal information

### 8.3 404 Page
- [ ] Error page with navigation

---

## Phase 9: Testing & Deployment (Days 21-22)

### 9.1 Testing
- [ ] Test all forms and validations
- [ ] Test API endpoints with Postman
- [ ] Test admin authentication flow
- [ ] Test email notifications
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

### 9.2 Frontend Deployment (Vercel)
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Test production deployment

### 9.3 Backend Deployment (Railway)
- [ ] Connect GitHub repo to Railway
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Test production API endpoints

### 9.4 Final Testing
- [ ] End-to-end testing in production
- [ ] Email notifications verification
- [ ] Performance optimization
- [ ] SEO checks

---

## File Structure

```
project-root/
├── frontend/                    # Next.js project
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js             # Home page
│   │   ├── services/
│   │   │   ├── page.js         # Services listing
│   │   │   └── [id]/
│   │   │       └── page.js     # Service detail
│   │   ├── contact/
│   │   │   └── page.js
│   │   ├── about/
│   │   │   └── page.js
│   │   └── admin/
│   │       ├── layout.js
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── services/
│   │       └── bookings/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── ServiceCard.js
│   │   ├── BookingForm.js
│   │   ├── AdminNavbar.js
│   │   └── ...
│   ├── lib/
│   │   ├── api.js             # API call utilities
│   │   └── auth.js            # Auth utilities
│   ├── public/
│   ├── styles/
│   ├── .env.local
│   ├── package.json
│   └── next.config.js
│
└── backend/                     # Express server
    ├── models/
    │   ├── User.js
    │   ├── Service.js
    │   └── Booking.js
    ├── routes/
    │   ├── auth.js
    │   ├── services.js
    │   ├── bookings.js
    │   └── contact.js
    ├── controllers/
    │   ├── authController.js
    │   ├── serviceController.js
    │   ├── bookingController.js
    │   └── contactController.js
    ├── middlewares/
    │   └── authMiddleware.js
    ├── config/
    │   └── db.js
    ├── utils/
    │   └── emailService.js
    ├── .env
    ├── server.js
    └── package.json
```

---

## Key Features Checklist

### Public Features
- [ ] Browse services
- [ ] Search services
- [ ] Filter by category
- [ ] View service details
- [ ] Book/Request service (no login)
- [ ] Contact website owner (no login)
- [ ] Responsive design

### Admin Features
- [ ] Login/Logout
- [ ] Create service listing
- [ ] Edit service listing
- [ ] Delete service listing
- [ ] View all inquiries
- [ ] Mark inquiry as contacted
- [ ] Delete inquiries
- [ ] Dashboard overview

### System Features
- [ ] Email notifications
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states
- [ ] Success messages
- [ ] Responsive design

---

## Installation & Setup Commands

```bash
# Frontend setup
npx create-next-app@latest frontend
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install axios cookie next-cookies react-hook-form react-hot-toast

# Backend setup
mkdir backend
cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv cors nodemailer
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## Resources & Tools

- **Frontend:** Next.js docs, TailwindCSS docs, React Hook Form
- **Backend:** Express docs, Mongoose docs, JWT intro
- **Database:** MongoDB Atlas, MongoDB Compass
- **Email:** Nodemailer docs, SendGrid docs
- **Deployment:** Vercel docs, Railway docs
- **API Testing:** Postman

---

## Timeline

- **Total Duration:** ~22 days (depending on experience level)
- **Development:** 18 days
- **Testing & Deployment:** 4 days

---

## Notes

- Start with backend API first, then frontend
- Test APIs with Postman before integrating with frontend
- Use dummy data initially for frontend development
- Implement error handling at every step
- Keep responsive design in mind throughout
- Deploy early to catch issues early
