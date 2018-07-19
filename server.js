// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// init sqlite db
var fs = require('fs');
var dbFile = '.data/quick-fixins.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var tableColumnsTypes = 
        "ID INTEGER PRIMARY KEY AUTOINCREMENT," +
        "Name TEXT," +
        "Ingredient0 TEXT," +
        "Ingredient1 TEXT," +
        "Ingredient2 TEXT," +
        "Ingredient3 TEXT," +
        "Ingredient4 TEXT," +
        "Ingredient5 TEXT," +
        "Ingredient6 TEXT," +
        "Ingredient7 TEXT," +
        "Ingredient8 TEXT," +
        "Ingredient9 TEXT," +
        "Step0 TEXT," +
        "Step1 TEXT," +
        "Step2 TEXT," +
        "Step3 TEXT," +
        "Step4 TEXT," +
        "EaseRating REAL," + 
        "EaseRatingCount INTEGER," +
        "TasteRating REAL," +
        "TasteRatingCount INTEGER," + 
        "Valid INTEGER";

var tableColumnsToInsert = 
        "Name," +
        "Ingredient0," +
        "Ingredient1," +
        "Ingredient2," +
        "Ingredient3," +
        "Ingredient4," +
        "Ingredient5," +
        "Ingredient6," +
        "Ingredient7," +
        "Ingredient8," +
        "Ingredient9," +
        "Step0," +
        "Step1," +
        "Step2," +
        "Step3," +
        "Step4," +
        "EaseRating," + 
        "EaseRatingCount," +
        "TasteRating," +
        "TasteRatingCount," +
        "Valid";        

// if the .db file does not exist, create it
if (!exists) {
    db.serialize(function() {
        db.run('CREATE TABLE Recipes (' + tableColumnsTypes + ')');
        
        // seed default recipes
        var stmt = db.prepare('INSERT INTO Recipes (' + tableColumnsToInsert + ') VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        stmt.run([
            'French Toast',
            'Bread (6 slices)',
            'Eggs (2)',
            'Milk (2/3 cups)',
            'Cinnamon (1 tsp)',
            'Sugar (1 tsp)',
            null,
            null,
            null,
            null,
            null,
            'Heat a pan or skillet to medium heat on a stove, and coat bottom of pan with a small amount of butter or oil',
            'Pour the milk and eggs into a bowl; gently mix them together so that the egg yolks are broken and the liquids are relatively mixed.',
            'Dip a bread slice in the egg mixture until all sides and edges are soaked, then fry in pan until golden on each side',
            'Mix sugar and cinnamon together; sprinkle on each slice after it is done cooking',
            null,
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

// listen for requests
var listener = app.listen(process.env.PORT, function () {
    console.log('Listening on port ' + listener.address().port);
});
