const express = require("express");
const appController = require("./controller/appController");
const session = require("express-session");

const app = express();
const port = 3000;

app.use(
  session({
    secret: "Spurgeon",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: "auto", maxAge: 3600000 }, // secure: 'auto' will use 'true' if site is on HTTPS
  })
);

// Set EJS as the template engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Route to display blogs
app.use("/", appController);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
