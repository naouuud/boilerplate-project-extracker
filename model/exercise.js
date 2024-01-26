const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  duration: { type: Number },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Exercise", exerciseSchema);
