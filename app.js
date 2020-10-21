//jshint esversion:6
const _ = require('lodash');
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

mongoose.connect('mongodb+srv://admin-roy:<db_password>@cluster0.woyal.mongodb.net/todoDB?retryWrites=true&w=majority', {
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
        if (!err) {
          foundList.items.push(item);
          foundList.save();
          res.redirect('/' + listName);
        }
      });
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
  const checkedItemId = req.body.checkboxID;
  const listName = req.body.listName;
  
  if (listName === 'Today'){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log('Successfully deleted checked item');
        res.redirect('/');
      }  
    });}
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundListDoc) {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
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

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port,function() {
  console.log('Server running');
});
