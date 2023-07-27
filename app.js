const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const port = 3000;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const listSchema = new mongoose.Schema({
  name: String,
  tasks: [taskSchema],
});

const Task = mongoose.model("task", taskSchema);

const List = mongoose.model("list", listSchema);

const item1 = new Task({
  name: "Welcome to ToDO App",
});

const item2 = new Task({
  name: "Hit the + Button to add a New Task",
});

const item3 = new Task({
  name: "Hit The CheckBox To Delete a Task",
});

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
  Task.find()
    .then((tasks) => {
      // console.log(tasks);
      if (tasks.length == 0) {
        Task.insertMany(defaultItems)
          .then(() => {
            console.log("Sucessfully Inserted Default Tasks");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { title: "Today", tasks: tasks });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", (req, res) => {
  // console.log(req.body)
  let itemName = req.body.task;
  let listName = req.body.list;
  const item = new Task({
    name: itemName,
  });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  }
  List.findOne({ name: listName })
    .then((foundList) => {
      foundList.tasks.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/delete", (req, res) => {
  // console.log(req.body.listName);
  const checkedId = req.body.checkBox;
  const listName = req.body.listName;
  if (listName == "Today") {
    Task.findByIdAndRemove(checkedId)
      .then(() => {
        console.log("Successfully Deleted");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { tasks: { _id: checkedId } } }
    )
      .then((foundList) => {
        res.redirect(`/${listName}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        //Show Existing List
        res.render("list", {
          title: customListName,
          tasks: foundList.tasks,
        });
      } else {
        //Create a New List
        const list = new List({
          name: customListName,
          tasks: defaultItems,
        });
        list.save();
        console.log("New List Created");
        res.redirect(`/${customListName}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});
