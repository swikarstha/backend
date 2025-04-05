const app = express();
const PORT = 3000;
const SECRET_KEY = "12345678910"; 

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// Database connection - using your existing connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "skillswap_db", 
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});
// signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query("INSERT INTO user (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);
    res.json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Error registering user" });
  }
});

//login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const results = await query("SELECT * FROM user WHERE email = ?", [email]);
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ message: "Login successful", token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Error during login" });
  }
});


// to delete account
app.delete('/delete/:id', (req, res) => {
  const userId = req.params.id;
  const sql = 'DELETE FROM user WHERE id = ?';

  db.query(sql, [userId], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Server error', error: err.message });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
