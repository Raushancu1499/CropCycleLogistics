# CropCycle Logistics

CropCycle Logistics is a full-stack MERN application that connects farmers and buyers with a direct marketplace for agricultural supply chain visibility, crop matching, and order logistics.

## 🚀 Live Deployment
- **Live Application:** [CropCycle Logistics Live Application](https://cropcycle-logistics-q1lmka0eu-raushancu1499s-projects.vercel.app/)
- **Frontend Hosting:** Vercel
- **Backend API Hosting:** Render
- **Database:** MongoDB Atlas

---

## 🏗️ Project Architecture

CropCycle Logistics is built on the **MERN Stack** (MongoDB, Express, React, Node.js), following a decoupled client-server architecture. This ensures a clear separation of concerns, making the platform highly scalable and maintainable.

---

## 🛠️ Technology Stack Deep-Dive

### 🎨 Frontend Core
- **React (v19)**
  - **Why:** To create a highly responsive and dynamic Single Page Application (SPA) that delivers a "premium" desktop-like experience for farmers and buyers.
  - **How:** Leverages Functional Components and Hooks (`useState`, `useEffect`, `useContext`) for efficient state management and side effects.
  - **When:** Powering every view in the application, from the interactive marketplace to the real-time notification engine.
- **React Router Dom (v7)**
  - **Why:** Essential for client-side navigation and implementing Role-Based Access Control (RBAC).
  - **How:** Defines a declarative routing manifest with custom `ProtectedRoute` components to secure sensitive dashboard views.
  - **When:** Used for all URL-based navigation and handling user redirects based on authentication state.
- **Axios**
  - **Why:** Provides a cleaner API for HTTP requests compared to Fetch, with built-in support for request/response interceptors and automated JSON transformations.
  - **How:** Centralized in an `api.js` utility to maintain consistency across all backend communications.
  - **When:** Every time the frontend interacts with the backend REST API (Login, Order creation, Product updates).
- **Lucide React**
  - **Why:** A beautiful, lightweight, and highly customizable icon library that enhances the UI's professional aesthetic.
  - **How:** Imported as SVG components, allowing for dynamic styling and perfect scaling on all screen sizes.
  - **When:** Used throughout the dashboard sidebars, marketplace filters, and action buttons.

### ⚙️ Backend Core
- **Node.js & Express (v5)**
  - **Why:** Chosen for its high-performance, non-blocking I/O model which is perfect for a logistics platform where speed is critical.
  - **How:** Implements a modular MVC-style architecture with clear separation between Routes, Controllers, and Middleware.
  - **When:** Serving the central API that handles all business logic, insurance processing, and order management.
- **MongoDB & Mongoose (v8)**
  - **Why:** The document-based structure allows for flexible "Crop" and "Requirement" schemas that can evolve as new agricultural products are added.
  - **How:** Utilizes Mongoose for schema validation, data modeling, and deep population of related documents (e.g., linking Orders to Users and Products).
  - **When:** Managing the lifecycle of every piece of data in the system.
- **JSON Web Token (JWT)**
  - **Why:** Provides a secure, stateless way to handle user sessions, ensuring the backend can verify user identity across distributed systems.
  - **How:** Tokens are signed with a server-side secret and stored in `localStorage` by the client, then verified via middleware on every protected request.
  - **When:** Every authorized API call after a successful login.

### 🔒 Security & Utilities
- **BcryptJS**
  - **Why:** Passwords must never be stored in plain text. Bcrypt provides industry-standard salted hashing to protect user data from breach.
  - **How:** Automatically hashes passwords during user registration and performs secure comparisons during login.
  - **When:** Active during the enrollment and authentication phases of the user lifecycle.
- **PDFKit**
  - **Why:** Essential for generating professional, printable logistics and insurance documents on-the-fly.
  - **How:** Utilizes a custom PDF generation stream in the `insuranceController` to create dynamic certificates.
  - **When:** Used when a farmer needs to download their digital insurance policy or a transaction receipt.
- **Multer**
  - **Why:** Handles complex `multipart/form-data` uploads (images and documents) with ease.
  - **How:** Configured to save files to the server's disk while maintaining unique file naming to prevent collisions.
  - **When:** Used during product listing (crop photos) and profile updates.

---

## 🔒 Security Best Practices

Security is baked into every layer of CropCycle Logistics:
1. **Password Hashing:** Utilizing `bcryptjs` with a cost factor of 10 to ensure collision-resistant security.
2. **Environment Isolation:** All sensitive credentials (DB URLs, JWT Secrets) are managed via environment variables and are **never** committed to the codebase.
3. **Stateless Auth:** JWT tokens provide a secure, expiration-based access system that prevents session hijacking.
4. **Input Sanitization:** All user inputs are trimmed and validated via Mongoose schemas to prevent injection attacks.
5. **RBAC:** Strict Role-Based Access Control ensures that Farmers cannot access Buyer data and vice-versa.

---

## 💻 How to Run Locally (VS Code)

To run the project locally, you will need to open **two separate split terminals** in VS Code (you can split your terminal by pressing `Ctrl + Shift + 5`) and start both the backend server and the frontend web app.

### 1. Start the Backend API
In your first terminal:
```bash
cd backend
npm install
npm run dev
```
*The backend API will start running on `http://localhost:5000`.*

### 2. Start the Frontend React App
In your second terminal:
```bash
cd frontend
npm install
npm start
```
*The React application will automatically open your web browser and run on `http://localhost:3000`.*

---

## 🔐 Administrative Access

### Admin Registration Key
To register a new account with the **Admin** role, you must provide the access key. 
- **Security Key:** Refer to your **Render Environment Variables** (for production) or your local **.env** file.
- **Note:** For security, this key is never stored in the public repository.

---

## 🗄️ Database Connection

### Production Database
The live application is connected to your private **MongoDB Atlas Cloud** cluster. Connection settings are managed securely via Render Environment Variables.

### Local Development Setup
To connect your local environment to a database, you must configure your **private** `backend/.env` file:

#### Option A: Connect to Cloud Database
Update your local `backend/.env` with your Atlas connection string. 
> [!NOTE]
> You can find your connection string in the **MongoDB Atlas Dashboard** under "Connect".

#### Option B: Use Local MongoDB (Offline)
1. Open **MongoDB Compass**.
2. Connect to `mongodb://127.0.0.1:27017`.
3. Set your local `backend/.env` to:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/cropcycle
   ```

---

**Note:** Always ensure your `backend/.env` file (which is ignored by Git) contains the correct `MONGO_URI` and `ADMIN_ACCESS_KEY` before starting the server.
