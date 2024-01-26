const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("./model/user");
const Exercise = require("./model/exercise");
const { MongoUnexpectedServerResponseError } = require("mongodb");

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// connect to database
(async function () {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected");
  } catch (err) {
    throw new Error("Database connection failed");
  }
})().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post(
  "/api/users",
  body("username", "Username is required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      next(result.array()[0].msg);
    }
    try {
      const user = new User({
        username: req.body.username,
      });
      await user.save();
      res.json({ username: user.username, _id: user._id });
    } catch (err) {
      next(err.message);
    }
  }
);

app.get("/api/users", async (req, res, next) => {
  const list = await User.find({}, { _id: 1, username: 1 }).exec();
  res.json(list);
});

app.post(
  "/api/users/:_id/exercises",
  body("description", "Description cannot be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("duration")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Duration cannot be empty")
    .matches(/^[1-9]\d*$/)
    .withMessage("Invalid duration"),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      next(result.array()[0].msg);
    }
    try {
      const user = await User.findById(req.params._id).exec();
      if (user === null) {
        const err = new Error("User Id not found");
        return next(err.message);
      }
      const exercise = new Exercise({
        user: req.params._id,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? req.body.date : new Date(),
      });
      await exercise.save();
      const entry = await Exercise.findById(exercise._id)
        .populate("user")
        .exec();
      res.json({
        _id: entry._id,
        username: entry.user.username,
        date: entry.date.toDateString(),
        duration: entry.duration,
        description: entry.description,
      });
    } catch (err) {
      next(err.message);
    }
  }
);

app.get("/api/users/:_id/logs", async (req, res, next) => {
  try {
    const user = await User.findById(req.params._id)
      .populate("username")
      .exec();
    if (user === null) {
      const err = new Error("User Id not found");
      return next(err.message);
    }
    const from = req.query.from ? { date: { $gte: req.query.from } } : {};
    const to = req.query.to ? { date: { $lte: req.query.to } } : {};
    const exercises = await Exercise.find({
      $and: [{ user: req.params._id }, from, to],
    }).limit(req.query.limit);
    const log = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: log,
    });
  } catch (err) {
    next(err.message);
  }
});

app.use((req, res, next) => {
  const err = new Error();
  err.message = "API endpoint not found";
  res.status(404);
  res.json(`${err.message}`);
});

app.use((err, req, res, next) => {
  res.json({ error: err });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
