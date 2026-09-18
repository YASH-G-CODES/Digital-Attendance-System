import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 5000);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const studentPhotoDirectory = path.join(serverDirectory, "uploads", "student-photos");
const users = [];
const subjects = [
  { id: "renewable-energy-resource", _id: "renewable-energy-resource", name: "Renewable Energy Resource", code: "RER-401", department: "CSE", faculty: { name: "Dr. Anjali Sharma" }, facultyName: "Dr. Anjali Sharma", students: [], status: "Active", active: true },
  { id: "artificial-intelligence", _id: "artificial-intelligence", name: "Artificial Intelligence", code: "AI-402", department: "CSE", faculty: { name: "Dr. Rahul Verma" }, facultyName: "Dr. Rahul Verma", students: [], status: "Active", active: true },
  { id: "cloud-computing", _id: "cloud-computing", name: "Cloud Computing", code: "CC-403", department: "CSE", faculty: { name: "Prof. Neha Gupta" }, facultyName: "Prof. Neha Gupta", students: [], status: "Active", active: true },
  { id: "reasoning-soft-skill", _id: "reasoning-soft-skill", name: "Reasoning and Soft Skill", code: "RSS-404", department: "CSE", faculty: { name: "Ms. Priya Singh" }, facultyName: "Ms. Priya Singh", students: [], status: "Active", active: true }
];
const attendance = [];

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(serverDirectory, "uploads")));

const publicUser = ({ password, ...user }) => user;
const currentUser = (req) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return users.find((user) => user.token === token);
};
const requireUser = (req, res, next) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ message: "Please sign in again." });
  req.user = user;
  next();
};

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Digital Attendance API" }));

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role = "student", department = "", studentPhoto = "" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ message: "This email is already registered." });

  let profilePhoto = "";
  if (role === "student") {
    const photoMatch = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(studentPhoto);
    if (!photoMatch) return res.status(400).json({ message: "A valid JPG, PNG, or WEBP student photo is required." });

    const photoBuffer = Buffer.from(photoMatch[2], "base64");
    if (!photoBuffer.length || photoBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Student photo must be smaller than 5 MB." });
    }

    const photoExtension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[photoMatch[1]];
    const photoFileName = `${randomUUID()}.${photoExtension}`;
    try {
      await mkdir(studentPhotoDirectory, { recursive: true });
      await writeFile(path.join(studentPhotoDirectory, photoFileName), photoBuffer);
      profilePhoto = `/uploads/student-photos/${photoFileName}`;
    } catch (error) {
      console.error("Unable to save student photo:", error);
      return res.status(500).json({ message: "Unable to save the student photo. Please try again." });
    }
  }

  users.push({ id: randomUUID(), name, email: email.toLowerCase(), password, role, department, profilePhoto, facultyStatus: role === "faculty" ? "pending" : "approved" });
  res.status(201).json({ message: "Registration successful. You can now sign in." });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === String(email).toLowerCase() && item.password === password);
  if (!user) return res.status(401).json({ message: "Invalid email or password. Register first if you do not have an account." });
  user.token = randomUUID();
  res.json({ token: user.token, user: publicUser(user), message: "Login successful" });
});

app.put("/api/user/profile", requireUser, async (req, res) => {
  const { name, department, profilePhoto = "" } = req.body;
  if (!name?.trim() || !department?.trim()) {
    return res.status(400).json({ message: "Name and department are required." });
  }

  let savedPhoto = req.user.profilePhoto;
  if (profilePhoto) {
    const photoMatch = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(profilePhoto);
    if (!photoMatch) return res.status(400).json({ message: "Please choose a valid JPG, PNG, or WEBP photo." });
    const photoBuffer = Buffer.from(photoMatch[2], "base64");
    if (!photoBuffer.length || photoBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Profile photo must be smaller than 5 MB." });
    }
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[photoMatch[1]];
    const photoFileName = `${randomUUID()}.${extension}`;
    try {
      await mkdir(studentPhotoDirectory, { recursive: true });
      await writeFile(path.join(studentPhotoDirectory, photoFileName), photoBuffer);
      savedPhoto = `/uploads/student-photos/${photoFileName}`;
    } catch (error) {
      console.error("Unable to update profile photo:", error);
      return res.status(500).json({ message: "Unable to save the profile photo. Please try again." });
    }
  }

  const previousName = req.user.name;
  const updatedName = name.trim();
  req.user.name = updatedName;
  req.user.department = department.trim();
  req.user.profilePhoto = savedPhoto;

  // Keep existing dashboard/search data in sync after a user changes their
  // display name. Attendance entries store a snapshot for quick listing.
  for (const item of attendance) {
    if (item.studentId === req.user.id) {
      item.studentName = updatedName;
      if (item.student) item.student.name = updatedName;
    }
    if (item.facultyId === req.user.id || item.facultyName === previousName) {
      item.facultyName = updatedName;
      if (item.faculty) item.faculty.name = updatedName;
    }
  }
  for (const subject of subjects) {
    if (subject.facultyId === req.user.id) {
      subject.facultyName = updatedName;
      if (subject.faculty) subject.faculty.name = updatedName;
    }
  }
  res.json({ message: "Profile updated successfully.", user: publicUser(req.user) });
});

app.post("/api/auth/forgot-password", (_req, res) => res.json({ message: "Password reset is unavailable in the local development API." }));
app.post("/api/auth/verify-reset-otp", (_req, res) => res.status(501).json({ message: "OTP email service is not configured." }));
app.post("/api/auth/reset-password", (_req, res) => res.status(501).json({ message: "OTP email service is not configured." }));

app.get("/api/subjects/available", requireUser, (_req, res) => res.json({ subjects }));
app.get("/api/subjects/my", requireUser, (req, res) => res.json({ subjects: subjects.filter((subject) => subject.facultyId === req.user.id) }));
app.post("/api/subjects", requireUser, (req, res) => {
  if (req.user.role !== "faculty") return res.status(403).json({ message: "Only faculty can create subjects." });
  const { name, code, department } = req.body;
  if (!name?.trim() || !code?.trim() || !department?.trim()) {
    return res.status(400).json({ message: "Subject name, code and department are required." });
  }
  const id = randomUUID();
  const subject = { id, _id: id, name: name.trim(), code: code.trim(), department: department.trim(), facultyId: req.user.id, facultyName: req.user.name, faculty: { name: req.user.name }, status: "Active", students: [], active: true };
  subjects.push(subject);
  res.status(201).json({ message: "Subject created", subject });
});
app.put("/api/subjects/:id", requireUser, (req, res) => {
  if (req.user.role !== "faculty") return res.status(403).json({ message: "Only faculty can edit subjects." });
  const subject = subjects.find((item) => item.id === req.params.id && item.facultyId === req.user.id);
  if (!subject) return res.status(404).json({ message: "Subject not found." });
  const { name, code, department, status } = req.body;
  if (!name?.trim() || !code?.trim() || !department?.trim()) {
    return res.status(400).json({ message: "Subject name, code and department are required." });
  }
  subject.name = name.trim();
  subject.code = code.trim();
  subject.department = department.trim();
  if (status === "Active" || status === "Inactive") {
    subject.status = status;
    subject.active = status === "Active";
  }
  res.json({ message: "Subject updated successfully.", subject });
});
app.delete("/api/subjects/:id", requireUser, (req, res) => {
  const index = subjects.findIndex((subject) => subject.id === req.params.id && subject.facultyId === req.user.id);
  if (index < 0) return res.status(404).json({ message: "Subject not found." });
  subjects.splice(index, 1);
  res.json({ message: "Subject deleted" });
});
app.post("/api/subjects/:id/join", requireUser, (req, res) => {
  const subject = subjects.find((item) => item.id === req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found." });
  if (!subject.students.includes(req.user.id)) subject.students.push(req.user.id);
  res.json({ message: "Subject joined" });
});
app.delete("/api/subjects/:id/leave", requireUser, (req, res) => {
  const subject = subjects.find((item) => item.id === req.params.id);
  if (subject) subject.students = subject.students.filter((id) => id !== req.user.id);
  res.json({ message: "Subject left" });
});

app.get("/api/attendance/records", requireUser, (_req, res) => res.json(attendance));
app.get("/api/attendance/history/:userId", requireUser, (req, res) => res.json(attendance.filter((item) => item.studentId === req.params.userId)));
app.get("/api/attendance/pending", requireUser, (_req, res) => res.json([]));
app.post("/api/attendance/self", requireUser, (req, res) => {
  const item = { id: randomUUID(), studentId: req.user.id, studentName: req.user.name, ...req.body, status: "Present", createdAt: new Date().toISOString() };
  attendance.push(item);
  res.status(201).json({ message: "Attendance marked", attendance: item });
});
app.post("/api/attendance/verify-selfie", requireUser, (_req, res) => res.status(503).json({ message: "Face recognition service is not ready yet." }));
app.post("/api/attendance/recognize-group", requireUser, (_req, res) => res.status(503).json({ message: "Face recognition service is not ready yet." }));
app.post("/api/attendance/mark", requireUser, (_req, res) => res.status(201).json({ message: "Attendance submitted for review." }));
app.put("/api/attendance/:action/:id", requireUser, (_req, res) => res.json({ message: "Attendance updated" }));

app.get("/api/admin/users", requireUser, (_req, res) => res.json(users.map(publicUser)));
app.get("/api/admin/faculty", requireUser, (_req, res) => res.json(users.filter((user) => user.role === "faculty").map(publicUser)));
app.get("/api/admin/settings", requireUser, (_req, res) => res.json({ campusLatitude: process.env.CAMPUS_LATITUDE || "", campusLongitude: process.env.CAMPUS_LONGITUDE || "", campusRadius: process.env.CAMPUS_RADIUS || 150 }));
app.put("/api/admin/faculty/:id/:action", requireUser, (req, res) => {
  const faculty = users.find((user) => user.id === req.params.id && user.role === "faculty");
  if (!faculty) return res.status(404).json({ message: "Faculty member not found." });
  faculty.facultyStatus = req.params.action === "approve" ? "approved" : "rejected";
  res.json({ message: `Faculty ${faculty.facultyStatus}` });
});
app.get("/api/user/faculty-profile", requireUser, (req, res) => res.json(publicUser(req.user)));

app.use((_req, res) => res.status(404).json({ message: "API route not found." }));
app.listen(port, () => console.log(`Digital Attendance API running on http://127.0.0.1:${port}`));
