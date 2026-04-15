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
In your first terminal, install the dependencies and start the Node.js server:
```bash
cd backend
npm install
npm run dev
```
*The backend API will start running on `http://localhost:5000` and confirm its connection to MongoDB.*

### 2. Start the Frontend React App
In your second split terminal, install the React dependencies and start the local development server:
```bash
cd frontend
npm install
npm start
```
*The React application will automatically open your web browser and run on `http://localhost:3000`.*

---

**Note:** If you run into any errors starting up locally, ensure your `.env` variables located inside the `backend/.env` file contain your active MongoDB connection string.
