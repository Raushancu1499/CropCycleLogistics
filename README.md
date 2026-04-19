# CropCycle Logistics

CropCycle Logistics is a full-stack MERN application that connects farmers and buyers with a direct marketplace for agricultural supply chain visibility, crop matching, and order logistics.

## 🚀 Live Deployment
- **Live Application:** [CropCycle Logistics Live Application](https://cropcycle-logistics-q1lmka0eu-raushancu1499s-projects.vercel.app/)
- **Frontend Hosting:** Vercel
- **Backend API Hosting:** Render
- **Database:** MongoDB Atlas

---

## 🛠️ Technology Stack

### Frontend
- **React (v19)**
  - **Why:** Used for its declarative component-based architecture which makes building complex UIs like the Farmer/Buyer dashboards efficient and scalable.
  - **How:** Implemented using Functional Components, Hooks (`useState`, `useEffect`), and a modular file structure.
  - **When:** Used throughout the entire user interface to manage application state and dynamic rendering.
- **React Router Dom**
  - **Why:** To enable seamless navigation without full page reloads, providing a smooth Single Page Application (SPA) experience.
  - **How:** Used to define protected routes and handle navigation between dashboards and the marketplace.
  - **When:** All client-side routing and access control logic.
- **Axios**
  - **Why:** A robust promise-based HTTP client that simplifies error handling and API communication.
  - **How:** Used to create instances that talk to the backend REST API.
  - **When:** Every time the frontend needs to fetch or send data to the server.

### Backend
- **Node.js & Express**
  - **Why:** Provides a fast, non-blocking environment ideal for handling multiple concurrent requests in a logistics platform.
  - **How:** Built as a RESTful API with structured routes, controllers, and middleware.
  - **When:** Powers the central application logic and serves as the bridge between the database and the frontend.
- **MongoDB & Mongoose**
  - **Why:** A NoSQL database was chosen for its flexibility in handling varying crop data and notification schemas.
  - **How:** Used Mongoose to define strict data models for Users, Orders, and Products.
  - **When:** All data persistence, from user profiles to marketplace listings.
- **JSON Web Token (JWT)**
  - **Why:** Enables secure, stateless authentication, allowing the backend to verify users without storing session data on the server.
  - **How:** Integrated into the login/registration flow and verified via custom middleware on protected routes.
  - **When:** During user login and for any action requiring authorization.
- **Multer**
  - **Why:** Specialized middleware for handling `multipart/form-data`, necessary for uploading images.
  - **How:** Configured to store uploaded files in the `backend/uploads` directory.
  - **When:** Used when farmers upload crop photos or buyers update their profile pictures.

### DevOps & Tools
- **Docker & Docker Compose**
  - **Why:** Ensures that the "it works on my machine" problem is eliminated by containerizing the environment.
  - **How:** Separate `Dockerfile`s for frontend and backend, managed by a root `docker-compose.yml`.
  - **When:** Used for both local development setup and streamlining production deployments.
- **Nginx**
  - **Why:** Used as a high-performance web server and reverse proxy.
  - **How:** Configured to serve the static production build of the React app and route traffic.
  - **When:** Production deployment optimization.

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
