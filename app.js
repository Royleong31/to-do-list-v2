//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const itemSchema = {
  name: String
};
const Item = mongoose.model('Item', itemSchema);

const todo1 = new Item({
  name: 'Buy food'
});
const todo2 = new Item({
  name: 'Cut hair'
});
const todo3 = new Item({
  name: 'Walk dog'
});

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model('List', listSchema);

const defaultItems = [todo1, todo2, todo3];


app.get("/", function(req, res) {
  const day = date.getDate();
  
  Item.find({}, (err, foundItems) => {
    
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) console.log(err);
        else console.log("Successfully added items");
        res.redirect('/');
      });
    } 
    else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }
  });

});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  if (itemName != '') {
    const item = new Item({
      name: itemName
    });
    if (listName === 'Today') {
      item.save();
      res.redirect('/');
    }
    else {
      List.findOne({name: listName}, function(err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect('/' + listName);
      })
    }
  }
  else if (listName === 'Today'){
    res.redirect('/');
  }
  else {
    res.redirect('/' + listName);
  }
});


app.get("/about", function(req, res) {
  res.render("about");
});

app.post('/delete', function(req, res) {
  const deletedItemId = req.body.checkboxID;
  Item.findByIdAndRemove(deletedItemId, function(err) {
    if (!err) console.log('Successfully deleted checked item');
  });
  res.redirect('/');
});

app.get('/:customListName', function(req, res) {
  const customListName = req.params.customListName;
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      
      if (!foundList) {
        const newToDoList = new List({
          name: customListName,
          items: defaultItems
        });
        newToDoList.save();
        res.redirect('/' + customListName)
      } 
      else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});