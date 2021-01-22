const mongoose = require("mongoose");
const validator = require("validator");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      validate(value) {
        if (value < 0) throw new Error("Age cannot be negative");
      },
      default: 0,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("invalid Email");
      },
      lowercase: true,
    },
    Password: {
      type: String,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password"))
          throw new Error("Cant cantain Password");
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.Password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

userSchema.methods.generateAuthTokens = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET_KEY
  );
  user.tokens = user.tokens.concat({ token });

  await user.save();

  return token;
};
userSchema.statics.findByCredentials = async (Email, Password) => {
  const user = await User.findOne({ Email });
  if (!user) throw new Error("Unable to login");

  const isMatch = await bycrypt.compare(Password, user.Password);

  if (!isMatch) throw new Error("Unable to Login");

  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("Password")) {
    user.Password = await bycrypt.hash(user.Password, 8);
  }

  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
