// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// init sqlite db
var fs = require('fs');
var dbFile = '.data/quick-fixins.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var tableColumns = [
    "ID",
    "Name",
    "Ingredients",
    "Steps",
    "EaseRating", 
    "EaseRatingCount",
    "TasteRating",
    "TasteRatingCount",
    "Valid"
];

var tableColumnsTypes = [
    "INTEGER PRIMARY KEY AUTOINCREMENT",
    "TEXT",
    "TEXT",
    "TEXT",
    "REAL", 
    "INTEGER",
    "REAL",
    "INTEGER", 
    "INTEGER"
];

// if the .db file does not exist, create it
if (!exists) {
    
    var tableColumnsWithTypes = "";
    for (var i = 0 ; i < tableColumns.length ; i++) {
        tableColumnsWithTypes += tableColumns[i] + " " + tableColumnsTypes[i];
        if (i != tableColumns.length - 1) {
            tableColumnsWithTypes += ",";
        }
    }
    
    var tableColumnsString = "";
    var paramsString = "";
    for (var i = 1 ; i < tableColumns.length ; i++) {
        tableColumnsString += tableColumns[i];
        paramsString += "?"
        if (i != tableColumns.length - 1) {
            tableColumnsString += ",";
            paramsString += ","
        }
    }

    db.serialize(function() {
        db.run('CREATE TABLE Recipes (' + tableColumnsWithTypes + ')');
        
        // seed default recipes
        var stmt = db.prepare('INSERT INTO Recipes (' + tableColumnsString + ') VALUES (' + paramsString + ')');
        stmt.run([
            'French Toast',
            '["Bread (6 slices)","Eggs (2)","Milk (2/3 cups)","Cinnamon (1 tsp)","Sugar (1 tsp)"]',
            '[' +
                '"Heat a pan or skillet to medium heat on a stove, and coat bottom of pan with a small amount of butter or oil",' +
                '"Pour the milk and eggs into a bowl; gently mix them together so that the egg yolks are broken and the liquids are relatively mixed.",' +
                '"Dip a bread slice in the egg mixture until all sides and edges are soaked, then fry in pan until golden on each side",' +
                '"Mix sugar and cinnamon together; sprinkle on each slice after it is done cooking"' + 
            ']',
            5,
            1,
            5,
            1,
            1
        ]);
        stmt.finalize();
    });
}

// Root page requests get redirected to the GitHub page where this code is hosted
app.get('/', function(request, response) {
    response.redirect('https://github.com/JohnBrockway/quick-fixins-backend');
});

// endpoint to get every recipe in the database
app.get('/getRecipes', function(request, response) {
    db.all('SELECT * from Recipes', function(err, rows) {
        response.send(JSON.stringify(rows));
    });
});

// endpoint to get a recipe by its ID in the database
app.get('/getRecipe', function(request, response) {
    var id = request.query.id;
    var stmt = db.prepare('SELECT * from Recipes WHERE ID=?');
    stmt.all(id, function(err, rows) {
        response.send(JSON.stringify(rows));
    });
    stmt.finalize();
});

// listen for requests
var listener = app.listen(process.env.PORT, function () {
    console.log('Listening on port ' + listener.address().port);
});
