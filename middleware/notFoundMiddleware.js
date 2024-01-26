const notFound = (req, res, next) => {
  res.status(404);
  res.render("notFound.ejs", { APP_NAME : process.env.APP_NAME, BODY_CONTENT : "Page Not Found" });
};

export { notFound };
