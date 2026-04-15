import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ADMIN_ACCESS_KEY } from "../config/businessRules.js";

const createUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  location: user.location,
  email: user.email || "",
  role: user.role,
});

const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email = "",
      password,
      role,
      phone,
      location,
      adminAccessKey = "",
    } = req.body;

    if (!name || !password || !role || !phone || !location) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (!["admin", "farmer", "buyer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    if (role === "admin") {
      if (!ADMIN_ACCESS_KEY) {
        return res
          .status(403)
          .json({ message: "Admin account creation is disabled for this environment" });
      }

      if (adminAccessKey.trim() !== ADMIN_ACCESS_KEY) {
        return res.status(403).json({ message: "Invalid admin access key" });
      }
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      password: hashedPassword,
      role,
      phone: phone.trim(),
      location: location.trim(),
    });

    res.status(201).json({
      message: "Registration successful",
      user: createUserPayload(user),
      token: createToken(user),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    const user = await User.findOne(
      phone ? { phone: phone.trim() } : { email: email.trim().toLowerCase() }
    );
    if (!user) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    res.json({
      message: "Login successful",
      user: createUserPayload(user),
      token: createToken(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
