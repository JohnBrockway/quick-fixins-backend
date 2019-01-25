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
            "French Toast",
            JSON.stringify(['Bread (6 slices)','Eggs (2)','Milk (2/3 cups)','Cinnamon (1 tsp)','Sugar (1 tsp)']),
            JSON.stringify([
                'Heat a pan or skillet to medium heat on a stove, and coat bottom of pan with a small amount of butter or oil',
                'Pour the milk and eggs into a bowl; gently mix them together so that the egg yolks are broken and the liquids are relatively mixed',
                'Dip a bread slice in the egg mixture until all sides and edges are soaked, then fry in pan until golden on each side',
                'Mix sugar and cinnamon together; sprinkle on each slice after it is done cooking'
            ]),
            5,
            1,
            5,
            1,
            1
        ]);
        stmt.run([
            "Egg in a Basket",
            JSON.stringify(['Bread (1 slice)','Eggs (1)']),
            JSON.stringify([
                'Heat a pan or skillet to medium heat on a stove, and coat bottom of pan with a small amount of butter or oil',
                'Separate the egg; put the white into a shallow bowl, and set the yolk aside for the time being',
                'Cut a ~1-inch round hole out of the center of the slice of bread',
                'Dip the slice of bread into the egg whites until it is soaked on both sides',
                'Put the bread in the heated pan, and immediately put the egg yolk in the hole of the bread',
                'Cook for 2-4 minutes per side, until egg yolk is cooked to desired texture'
            ]),
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

// Endpoint for a status check of the server and db
app.get('/v1/up', function(request, response) {
    if (fs.existsSync(dbFile)) {
        response.sendStatus(200);
    }
    else {
        response.status(500).send("Database not found");
    }
});

// endpoint to get every recipe in the database
app.get('/v1/getRecipes', function(request, response) {
    db.all('SELECT * from Recipes', function(err, rows) {
        if (err) {
            response.status(500).send(err);
        }
        else {
                for (var i = 0 ; i < rows.length ; i++) {
                rows[i].Ingredients = JSON.parse(rows[i].Ingredients);
                rows[i].Steps = JSON.parse(rows[i].Steps);
            }
            response.send(JSON.stringify(rows));
        }
    });
});

// endpoint to get every recipe in the database with Valid flag set to true
app.get('/v1/getValidRecipes', function(request, response) {
    db.all('SELECT * from Recipes WHERE Valid=1', function(err, rows) {
        if (err) {
            response.status(500).send(err);
        }
        else {
            for (var i = 0 ; i < rows.length ; i++) {
                rows[i].Ingredients = JSON.parse(rows[i].Ingredients);
                rows[i].Steps = JSON.parse(rows[i].Steps);
            }
            response.send(JSON.stringify(rows));
        }
    });
});

// endpoint to get a random ID from the database that is guaranteed to correspond to a valid recipe
app.get('/v1/getRandomValidID', function(request, response) {
    db.all('SELECT ID from Recipes WHERE Valid=1', function(err, rows) {
        if (err) {
            response.status(500).send(err);
        }
        else {
            var randomIndex = Math.floor(Math.random() * rows.length);
            response.send(JSON.stringify(rows[randomIndex].ID));
        }
    });
});

// endpoint to get a recipe by its ID in the database
app.get('/v1/getRecipeByID', function(request, response) {
    var id = request.query.id;
    var stmt = db.prepare('SELECT * FROM Recipes WHERE ID=?');
    stmt.all(id, function(err, rows) {
        if (err) {
            response.status(500).send(err);
        }
        else {
            if (rows.length == 0) {
                response.send(JSON.stringify(null));
            }
            else {
                rows[0].Ingredients = JSON.parse(rows[0].Ingredients);
                rows[0].Steps = JSON.parse(rows[0].Steps);
                response.send(JSON.stringify(rows[0]));
            }
        }
    });
    stmt.finalize();
});

// endpoint to get a list of recipes given a list of IDs in the database
app.get('/v1/getRecipesByIDs', function(request, response) {
    var ids = request.query.ids;
    var idListParams = "";
    for (var i = 0 ; i < ids.length ; i++) {
        idListParams += "?";
        if (i != ids.length - 1) {
            idListParams += ","
        }
    }
    var stmt = db.prepare('SELECT * FROM Recipes WHERE ID IN (' + idListParams + ')');
    stmt.all(ids, function(err, rows) {
        if (err) {
            response.status(500).send(err);
        }
        else {
            if (rows.length == 0) {
                response.send(JSON.stringify(null));
            }
            else {
                for (var i = 0 ; i < rows.length ; i++) {
                    rows[i].Ingredients = JSON.parse(rows[i].Ingredients);
                    rows[i].Steps = JSON.parse(rows[i].Steps);
                }
                response.send(JSON.stringify(rows));
            }
        }
    });
    stmt.finalize();
});

// endpoint to add a new recipe to the database
app.post('/v1/addRecipe', function(request, response) {
    var recipe = request.body;

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
        var stmt = db.prepare('INSERT INTO Recipes (' + tableColumnsString + ') VALUES (' + paramsString + ')');
        stmt.run([
            recipe.Name,
            JSON.stringify(recipe.Ingredients),
            JSON.stringify(recipe.Steps),
            5,
            1,
            5,
            1,
            1
        ]);
        stmt.finalize();
    });

    response.sendStatus(200);
});

// endpoint to rate the ease of a recipe
app.post('/v1/rateRecipeEase', function(request, response) {
    var input = request.body;

    db.serialize(function() {
        var stmt1 = db.prepare('SELECT EaseRating, EaseRatingCount FROM Recipes WHERE ID=?');
        stmt1.all(input.ID, function(err, rows) {
            if (err) {
                response.status(500).send(err);
            }
            else {
                if (rows.length == 0) {
                    response.status(500).send('ID not found');
                }
                else if (isNaN(input.EaseRating)) {
                    response.status(500).send('Rating was not a number');
                }
                else {
                    var currentRating = rows[0].EaseRating;
                    var currentCount = rows[0].EaseRatingCount;

                    var newRating = (currentRating * currentCount / (currentCount + 1)) + (input.EaseRating / (currentCount + 1));

                    var stmt2 = db.prepare('UPDATE Recipes SET EaseRating=?, EaseRatingCount=? WHERE ID=?');
                    stmt2.run([
                        newRating,
                        currentCount + 1,
                        input.ID
                    ]);
                    stmt2.finalize();

                    response.sendStatus(200);
                }
            }
        });
        stmt1.finalize();
    });
});

// endpoint to rate the taste of a recipe
app.post('/v1/rateRecipeTaste', function(request, response) {
    var input = request.body;

    db.serialize(function() {
        var stmt1 = db.prepare('SELECT TasteRating, TasteRatingCount FROM Recipes WHERE ID=?');
        stmt1.all(input.ID, function(err, rows) {
            if (err) {
                response.status(500).send(err);
            }
            else {
                if (rows.length == 0) {
                    response.status(500).send('ID not found');
                }
                else if (isNaN(input.TasteRating)) {
                    response.status(500).send('Rating was not a number');
                }
                else {
                    var currentRating = rows[0].TasteRating;
                    var currentCount = rows[0].TasteRatingCount;

                    var newRating = (currentRating * currentCount / (currentCount + 1)) + (input.TasteRating / (currentCount + 1));

                    var stmt2 = db.prepare('UPDATE Recipes SET TasteRating=?, TasteRatingCount=? WHERE ID=?');
                    stmt2.run([
                        newRating,
                        currentCount + 1,
                        input.ID
                    ]);
                    stmt2.finalize();

                    response.sendStatus(200);
                }
            }
        });
        stmt1.finalize();
    });
});

// endpoint to set the Valid flag of an entry to false
app.post('/v1/invalidateRecipe', function(request, response) {
    var input = request.body;

    db.serialize(function() {
        var stmt = db.prepare('UPDATE Recipes SET Valid=0 WHERE ID=?');
        stmt.run(input.ID);
        stmt.finalize();
        response.sendStatus(200);
    });
});

// endpoint to set the Valid flag of an entry to true
app.post('/v1/validateRecipe', function(request, response) {
    var input = request.body;

    db.serialize(function() {
        var stmt = db.prepare('UPDATE Recipes SET Valid=1 WHERE ID=?');
        stmt.run(input.ID);
        stmt.finalize();
        response.sendStatus(200);
    });
});

// listen for requests
var listener = app.listen(process.env.PORT, function () {
    console.log('Listening on port ' + listener.address().port);
});
