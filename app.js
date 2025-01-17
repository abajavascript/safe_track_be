const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const regionRoutes = require("./routes/regionRoutes");
const responseRoutes = require("./routes/responseRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
