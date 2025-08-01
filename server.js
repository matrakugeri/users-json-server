const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_PATH = "./db.json";

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// GET /users (with filters)
app.get("/users", (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    job,
    archived,
    date,
    keyword,
    start,
    limit,
    sortDirection = null,
    sortField,
  } = req.query;
  let users = readDB().users;

  if (firstName)
    users = users.filter((u) =>
      u.firstName.toLowerCase().includes(firstName.toLowerCase())
    );
  if (lastName)
    users = users.filter((u) =>
      u.lastName.toLowerCase().includes(lastName.toLowerCase())
    );
  if (gender) users = users.filter((u) => u.gender === gender);
  if (job)
    users = users.filter((u) =>
      u.job.toLowerCase().includes(job.toLowerCase())
    );
  if (date) users = users.filter((u) => u.date === date);
  if (archived !== undefined)
    users = users.filter((u) => u.archived === (archived === "true"));

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    users = users.filter((u) =>
      [u.firstName, u.lastName, u.gender, u.job, u.date]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lowerKeyword))
    );
  }

  if (sortField && (sortDirection === "asc" || sortDirection === "desc")) {
    users.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "desc"
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }

      if (aVal < bVal) return sortDirection === "desc" ? 1 : -1;
      if (aVal > bVal) return sortDirection === "desc" ? -1 : 1;
      return 0;
    });
  }

  const total = users.length;

  const startIndex = parseInt(start) || 0;
  const endIndex = limit ? startIndex + parseInt(limit) : users.length;

  const data = users.slice(startIndex, endIndex);

  res.json({ data, total });
});

// GET /users/:id
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = readDB().users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// POST /users
app.post("/users", (req, res) => {
  const db = readDB();
  const newUser = {
    id: Date.now(),
    ...req.body,
  };
  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

// PUT /users/:id
app.put("/users/:id", (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: "User not found" });

  db.users[index] = { ...db.users[index], ...req.body };
  writeDB(db);
  res.json(db.users[index]);
});

// DELETE /users/:id
app.delete("/users/:id", (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: "User not found" });

  const removed = db.users.splice(index, 1);
  writeDB(db);
  res.json(removed[0]);
});
app.get("/", (req, res) => {
  res.send("API server is running");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
