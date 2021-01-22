const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const auth = require("../middlewares/auth");
const sharp = require("sharp");
const { welcomeMail, cancellationMail } = require("../mail/account");
const { cancellationMessage } = require("../mail/account");
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|png|jpg)$/))
      return cb(new Error("Please Upload An Image"));
    cb(undefined, true);
  },
});

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    const token = await user.generateAuthTokens();

    welcomeMail(user.Email, user.name);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.Email,
      req.body.Password
    );

    const token = await user.generateAuthTokens();

    res.send({ user, token });
  } catch (e) {
    res.status(404).send({ error: "Not found" });
  }
});
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    // req.user.token = "";
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updatedUser = Object.keys(req.body);
  const userfields = ["name", "age", "Email", "Password"];
  const isValidUpdate = updatedUser.every((field) =>
    userfields.includes(field)
  );

  if (!isValidUpdate) return res.status(404).send({ error: "Invalid Update" });

  try {
    const user = await User.findById(req.user._id);
    updatedUser.forEach((field) => (req.user[field] = req.body[field]));
    req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    cancellationMail(req.user.Email, req.user.name);
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .png()
      .resize({ width: 250, height: 250 })
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user.avatar) throw new Error();
    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
