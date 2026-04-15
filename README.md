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
