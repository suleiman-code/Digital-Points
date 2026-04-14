# Digital Points - Professional Business Directory Platform

Digital Points is a robust, premium-designed business directory platform that allows users to discover local services, filtered by price and ratings, while providing business owners with a powerful admin dashboard to manage their digital presence.

## 🚀 Key Features

*   **Advanced search & discovery:** Powerful sidebar filters for Category, Price Range, and star-based Ratings.
*   **Service Gallery (Lightbox):** Admin can upload multiple images (up to 8) to showcase their work, which clients can view in a beautiful fullscreen lightbox.
*   **Live Business Status:** Timezone-aware "Open Now" status for all 50 USA states and Canadian provinces based on specific business hours.
*   **Premium Location UI:** Integrated Google Maps with a modern, interactive card design and direct "View Full Map" navigation.
*   **Real-time Rating Logic:** Automatic calculation of average ratings and total review counts when a client submits a review.
*   **Lead Inquiry System:** Secure contact forms for clients to request quotes or details directly from the business owner, including mandatory city field verification.
*   **Fully Responsive:** Professional and premium UI optimized for mobile, tablet, and desktop devices with modern micro-animations.
*   **Advanced Admin Dashboard:** A comprehensive UI for administrators to add, edit, or remove listings with local image upload support.
*   **Modern Tech Stack:** Built with performance and SEO in mind.

## 🛠 Tech Stack

### Backend
*   **Framework:** FastAPI (Python 3.12+)
*   **Database:** MongoDB Atlas (NoSQL)
*   **Security:** JWT-based Administration Security
*   **File Storage:** Local Static Uploads
*   **Documentation:** Swagger UI (/docs)

### Frontend
*   **Framework:** Next.js (App Router)
*   **Styling:** Modern Vanilla CSS + Tailwind CSS
*   **Animations:** Framer Motion
*   **Forms:** React Hook Form
*   **Real-time notifications:** React Hot Toast

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/DigitalPoints.git
cd DigitalPoints
```

### 2. Backend Setup
*   Navigate to the `backend/` directory.
*   Create a virtual environment: `python -m venv venv`.
*   Activate it: `venv\\Scripts\\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
*   Install dependencies: `pip install -r requirements.txt`.
*   Configure `.env` with your MongoDB URI.
*   Run the server: `python main.py` or `uvicorn main:app --reload`.

### 3. Frontend Setup
*   Navigate to the `frontend/` directory.
*   Install dependencies: `npm install`.
*   Run the development server: `npm run dev`.
*   Access the site at `http://localhost:3000`.

## 📂 Project Structure

*   `/backend`: Python FastAPI logic, models, and API routes.
*   `/frontend`: Next.js application, components, and global styling.
*   `/static/uploads`: Directory for local business image storage.

---

Digital Points - Empowering Local Businesses.
