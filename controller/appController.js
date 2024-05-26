const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../database");

router.get("", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "select * from blogs order by id desc limit 3"
    );
    res.render("index", { categories: await getCategories(), topBlogs: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/about", async (req, res) => {
  try {
    res.render("about", { categories: await getCategories() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contact", async (req, res) => {
  try {
    res.render("contact", { categories: await getCategories() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/blog", async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const category = req.query.c_name || "all";

    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const offset = (page - 1) * limit;

    const searchQuery =
      "select b.*, u.name as author_name from blogs b join user u on b.author_id = u.id where title like '%$keyword%' and category like '$category' and isApproved = TRUE LIMIT $limit OFFSET $offset";
    const replaceSearchQuery = searchQuery.replace(/\$keyword/g, keyword);
    const replaceSearchQuery2 = replaceSearchQuery.replace(
      /\$category/g,
      category === "all" ? "%%" : category
    );
    const replaceSearchQuery3 = replaceSearchQuery2.replace(/\$limit/g, limit);
    const replaceSearchQuery4 = replaceSearchQuery3.replace(
      /\$offset/g,
      offset
    );
    console.log(replaceSearchQuery4);
    const [rows] = await pool.query(replaceSearchQuery4, [limit, offset]);

    const countQuery =
      "select COUNT(*) as total from blogs b join user u on b.author_id = u.id where title like '%$keyword%' and category like '$category' and isApproved = TRUE";
    const replaceCountQuery = countQuery.replace(/\$keyword/g, keyword);
    const replaceCountQuery2 = replaceCountQuery.replace(
      /\$category/g,
      category === "all" ? "%%" : category
    );
    const [countRows] = await pool.query(replaceCountQuery2, [`%${keyword}%`]);
    const totalArticles = countRows[0].total;

    const totalPages = Math.ceil(totalArticles / limit);

    res.render("blog", {
      category: category,
      categories: await getCategories(),
      totalPages,
      currentPage: page,
      blogs: rows,
      keyword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/getBlogs", async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const searchQuery =
      "select b.*, u.name as author_name from blogs b join users u on b.author_id = u.id where title like '%$keyword%' and isApproved = TRUE";
    const replaceSearchQuery = searchQuery.replace(/\$keyword/g, keyword);
    const [rows] = await pool.query(replaceSearchQuery);

    return res.json({ blogs: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/login", async (req, res) => {
  res.render("login", { username: "", password: "", error: "" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const query =
      "select * from userss where username = '$username' and password = '$password'";
    const replaceQuery = query.replace(/\$username/g, username);
    const replaceQuery2 = replaceQuery.replace(/\$password/g, password);
    const [rows] = await pool.query(replaceQuery2);
    const user = rows[0];
    if (!user) {
      res.render("login", {
        username,
        password,
        error: "Invalid username/password",
      });
    } else {
      req.session.user = user;
      res.redirect("/");
    }
  } catch (error) {
    console.error("Login error", error);
    res.status(500).send("Internal server error");
  }
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      console.error("Failed to destroy the session during logout.", err);
      return res.status(500).send("Could not log out, error occurred.");
    }

    res.clearCookie("connect.sid"); // Make sure to replace 'connect.sid' with the name of your session cookie if different
    res.redirect("/login"); // Redirect to login or home page after logout
  });
});

module.exports = router;

const getCategories = async () => {
  const query =
    "SELECT DISTINCT category from blogs WHERE category IS NOT NULL";
  const [rows] = await pool.query(query);
  return [{ category: "All" }, ...rows];
};
