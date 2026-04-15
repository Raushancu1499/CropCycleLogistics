import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want web vitals, uncomment below and add a function:
// import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
// const reportWebVitals = (onPerfEntry) => { getCLS(onPerfEntry); getFID(onPerfEntry); getFCP(onPerfEntry); getLCP(onPerfEntry); getTTFB(onPerfEntry); };
// reportWebVitals(console.log);

// CRA’s HMR is managed by react-scripts; no need for manual module.hot here.
