import express from "express";

const router = express.Router();

router.get('', (req, res) => {
     res.render("index.ejs", { APP_NAME : process.env.APP_NAME, APP_VERSION : process.env.APP_VERSION});
});

export default router;