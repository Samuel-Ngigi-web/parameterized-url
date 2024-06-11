const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortid = require("shortid");

const app = express();
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
// app.use("/images", express.static("views/images"));

mongoose.connect("mongodb://127.0.0.1:27017/dbstructure");

const usersSchema = new mongoose.Schema({
  uid: String,
  username: String,
  email: String,
  password: String,
});
const usersModel = new mongoose.model("Users", usersSchema);

const notesSchema = new mongoose.Schema({
  uid: String,
  // noteid: String,
  notes: String,
});
const notesModel = new mongoose.model("Notes", notesSchema);

//ROUTES
app.get("/", function (req, res) {
  res.render("landingpg");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", async function (req, res) {
  // NB: To ensure 0 chances of generating duplicate userid even when the database grows big, use mongoDB-generated object id(ie _id)
  const uid = shortid.generate();
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  let userExist = await usersModel.findOne({ username: username });
  if (userExist) {
    res.json("userexist");
  } else {
    const newUser = new usersModel({
      uid: uid,
      username: username,
      email: email,
      password: password,
    });
    newUser
      .save()
      .then(() => {
        res.render("login");
        // res.json("success");
      })
      .catch((err) => {
        res.json(err);
      });
  }
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const userdata = await usersModel.find({ email: email }); //Gives back an array of objects with all emails that matched the querry.
  if (userdata.length == 1) {
    //checks to be sure that only one account exist with that email;
    if ((await userdata[0].password) === password) {
      //we are checking password for index[0] because we are sure that our array's length is 1.
      res.redirect("home/" + userdata[0].uid);
    } else {
      res.send("password doesn't match.");
    }
  } else {
    res.send(
      "<h2>No user account is associated with that email. Kindly consider signing up</h2>"
    );
  }
});

app.get("/home/:id", async function (req, res) {
  const username = await usersModel.find({ uid: req.params.id });
  res.render("home", {
    id: req.params.id,
    name: username[0].username.split(" ")[0],
  });
});
app.get("/home/:id/about", function (req, res) {
  res.render("about", { id: req.params.id });
});

app.get("/home/:id/addNote", function (req, res) {
  res.render("addNoteForm", { id: req.params.id });
});
app.post("/home/:id/addNote", function (req, res) {
  const note = req.body.note;
  const newNote = new notesModel({
    uid: req.params.id,
    notes: note,
  });
  newNote
    .save()
    .then(() => {
      console.log("note saved!");
      res.redirect("/home/" + req.params.id);
    })
    .catch((err) => {
      res.json(err);
    });
});

app.get("/home/:id/myNotes", async function (req, res) {
  const uid = req.params.id;
  const myNotes = await notesModel.find({ uid: uid });
  if (myNotes.length > 0) {
    // console.log(myNotes);
    res.render("myNotes", { notes: myNotes });
  } else {
    res.send("<h3>No notes found!</h2>");
  }
});

const port = process.env.port;
app.listen(port || 3001, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("The serve is running on port 3001");
  }
});
