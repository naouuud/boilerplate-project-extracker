const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
  }
  //   { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
