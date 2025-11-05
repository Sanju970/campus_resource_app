import db from "../db.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).send("Invalid email format");

  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashed, role],
    (err) => {
      if (err) return res.status(500).send(err);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: "your_email@gmail.com", pass: "app_password" },
      });
      transporter.sendMail({
        from: "your_email@gmail.com",
        to: email,
        subject: "Registration Successful",
        text: `Welcome ${name}! Your account has been created.`,
      });
      res.status(200).send("User registered successfully");
    }
  );
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, data) => {
    if (err) return res.status(500).send(err);
    if (!data.length) return res.status(404).send("User not found");

    const valid = await bcrypt.compare(password, data[0].password);
    if (!valid) return res.status(401).send("Invalid credentials");

    req.session.user = data[0];
    res.status(200).send({ message: "Login successful", user: data[0] });
  });
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.status(200).send("Logged out");
};
