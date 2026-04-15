# CropCycle Logistics

CropCycle Logistics is a full-stack MERN application that connects farmers and buyers with a direct marketplace for agricultural supply chain visibility, crop matching, and order logistics.

## 🚀 Live Deployment
- **Live Application:** [CropCycle Logistics Live Application](https://cropcycle-logistics-q1lmka0eu-raushancu1499s-projects.vercel.app/)
- **Frontend Hosting:** Vercel
- **Backend API Hosting:** Render
- **Database:** MongoDB Atlas

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

### Admin Registration Keys
To register a new account with the **Admin** role, you must provide the access key:
- **Local Development:** `cropcycle-admin`
- **Production (Live):** `crop-logistics-admin-2026`

### Test Account Credentials
You can also log in to an existing test account to explore all features:
- **Role:** Admin / Tester
- **Phone:** `5551234567`
- **Password:** `testpass123`

---

## 🗄️ Database Connection

### Production Database
The live application is already connected to **MongoDB Atlas Cloud**. Data entered via the live site is stored securely in the cloud cluster.

### Local Development Setup
To connect your local VS Code environment to a database, you have two options:

#### Option A: Connect to Live Cloud Database (Recommended)
This allows your local code to use the same data as the live website. Update `backend/.env` with your Atlas connection string:
```env
MONGO_URI=mongodb+srv://raushanbca998_db_user:raushanbca998@cluster0.hhpbwkq.mongodb.net/cropcycle?retryWrites=true&w=majority&appName=Cluster0
```

#### Option B: Use Local MongoDB (Offline)
If you prefer to work offline, ensure you have MongoDB installed locally or run it via Docker:
1. Open **MongoDB Compass**.
2. Connect to `mongodb://127.0.0.1:27017`.
3. Set your `backend/.env` to:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/cropcycle
   ```

---

**Note:** Always ensure your `backend/.env` file is present and contains the correct `MONGO_URI` before starting the server.
