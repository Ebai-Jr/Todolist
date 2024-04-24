//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://TEJ:Testajy@cluster0.p7btejb.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todoList."
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //No longer works
  // Item.find({},  function(err, foundItems) {
  //   console.log(foundItems);
  // })
  Item.find({})
    .then(foundItems => {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then((result) => {
            console.log("Successfully added items");
          })
          .catch((error) => {
            console.log("Error adding idems", error);
          });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

  })
    .catch(err => {
      console.log(err);
  });


});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then((foundList) => {
      if(!foundList){
        // console.log("Doesn't Exist");
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      } else {
        // console.log("Exists");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }     
    })
    .catch((error) => {
      console.error("Error Finding", error);
    });

  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/"); 
  } else {
    List.findOne({name: listName})
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log("Error adding custom item", err);
      });
  }

  

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
      Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Successfully Deleted Item.");
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error deleting item:", err);
      });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      .then(() => {
          res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log("Error adding custom item", err);
      });
      
      
    }
  });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
