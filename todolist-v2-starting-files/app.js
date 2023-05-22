const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = {
  name: String
};

const ITEM_SCHEMA = mongoose.Schema(itemsSchema)

const Item = mongoose.model("Item", ITEM_SCHEMA);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const LIST_SCHEMA = mongoose.Schema(listSchema)

const List = mongoose.model("List", LIST_SCHEMA);

app.get("/", function (req, res) {
  try {
    Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved default items to DB!");
          res.redirect("/");
        })
        .catch(function (err) {
          console.log("Error inserting default items:", err);
        });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(err => {
      console.log("Error finding items:", err);
    });
  } catch (err) {
    res.status(400).send(String(err));
  }
});

app.get("/:customListName", async (req, res) => {
  try {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
    .then(foundList => {
      if (foundList) {
	      //Show an existing list.
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        //Create a new list.
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
      }
    }).catch(err => {
      console.log("Error finding items:", err);
    });
  } catch (err) {
    res.status(400).send(String(err));
  }
});

app.post("/", async (req, res) => {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today")
  {
  item.save();
  console.log("Item saved in DB!");
  res.redirect("/");
  }
  else {
    List.findOne({name: listName}).then(foundList => {
      foundList.items.push(item);
      foundList.save();
      console.log("Item saved in DB!");
      res.redirect("/" + listName);
    });
  }
  }
  catch (err) {
    res.status(400).send(String(err));
  }
});

app.post("/delete", async (req, res) => {
  try {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function(deletedItem) {
      if (deletedItem) {
        console.log("Successfully deleted checked item!");
        console.log(deletedItem);
        res.redirect("/");
      }
    }).catch(err => {
      console.log("Error:", err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(foundList => {
      if (foundList){
        console.log("Successfully deleted checked item!");
        res.redirect("/" + listName);
      }
    }).catch(err => {
      console.log("Error:", err);
    });
  }
} catch (err) {
  res.status(400).send(String(err));
}
});

/*app.get("/migrateItems", async (req, res) => {
try {
let items = await Item.find({});
if (items.length < 1) {
defaultItems.forEach(async (item) => {
await item.save();
})
} else {
throw new Error('default migration not needed');
}
res.status(201).send('finished migrations')
} catch (err) {
console.log(err);
res.status(400).send(String(err));
}
});

app.get("/items", async (req, res) => {
try {
let items = await Item.find({});
res.status(200).send(items)
} catch (err) {
console.log(err);
res.status(400).send(String(err));
}
});*/

/*app.get("/work", function(req, res) {
res.render("list", { listTitle: "Work List", newListItems: workItems });
});*/

/*app.get("/about", function(req, res) {
  res.render("about");
});*/

app.listen(3000, function() {
  mongoose.connect("mongodb+srv://dragosburcut:dragosburcut@cluster0.tr0mvwk.mongodb.net/todolistDB",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 5000
  }).catch(err => console.log(err));
  console.log("Server started on port 3000.");
});
