const cors = require('cors')
const express = require('express');
const session = require('express-session');
const model = require('./model');

const app = express();
app.use(express.static("public"));
app.use(session({
    secret: "13rough134u9hoi1nqrvu14p398hgiu1oniup43789quc",
    saveUninitialized: true,
    resave: false,
    // cookie: {
    //     // secure: true, // fixes chrome, breaks postman.
    //     sameSite: 'None'
    // }
}))
app.use(express.urlencoded({ extended: false }))
// app.use(cors({
//     credentials: true,
//     origin: function (origin, callback) {
//         callback(null, origin); //avoid using the wildcare origin
//     }
// }))
app.use(cors())

// MY middlewares
// You have access YOUR OWN data, but NOBODY ELSES unless it is made PUBLIC

function authorizeRequest(request, response, next) {
    console.log("Checking session userId:", request.session.userId); // Start with this log
    if (request.session && request.session.userId) {
        model.User.findOne({ _id: request.session.userId }).then(function(user) {
            if (user) {
                request.user = user;
                console.log("User authenticated:", user.email); // Confirm user is authenticated
                next();
            } else {
                console.log("User not found."); // If user not found
                // response.status(401).send("Not authenticated");
                response.status(401).json({error: "Not authenticated", reason: "Session ID missing or invalid"});

            }
        });
    } else {
        console.log("No session or userId found."); // If no session
        // response.status(401).send("Not authenticated");
        response.status(401).json({error: "Not authenticated", reason: "Session ID missing or invalid"});

    }
}

// get the signed in users username
function getSignedInUser(request, response, next) {
    if (request.session && request.session.userId) {
        model.User.findOne({ _id: request.session.userId }).then(function(user) {
            if (user) {
                request.user = user;
                next();
            } else {
                response.status(401).send("Not authenticated");
            }
        });
    } else {
        response.status(401).send("Not authenticated");
    }
}

// function authorizeRequest(request, response, next) {
//     if (request.session && request.session.userId) {
//         model.User.findOne({ _id: request.session.userId }).then(function(user) {
//             if (user) {
//                 request.user = user;
//                 next();
//             } else {
//                 response.status(401).send("Not authenticated");
//             }
//         });
//     } else {
//         response.status(401).send("Not authenticated");
//     }
// }
// function authorizeRequest(request, response, next) {
//     if (request.session && request.session.userID){
//         next();
//     } else{
//         response.status(401).send("Not authenticated");
//     }}

// function authorizeRequestHelper(adminOnly, request, response, next) {
//     if (request.session && request.session.userID) {
//         model.User.findOne({ _id: request.session.userID }).then(function (user) {
//             if (user && (!adminOnly || user.admin)) {
//                 request.user = user;
//                 next();
//             } else{
//                 response.status(401).send("Not authenticated");
//             }
//         })
//     } else{
//         response.status(401).send("Not authenticated");
//     }
// }

// function authorizeRequestNonAdmin(request, response, next) {
//     authorizeRequestHelper(false, request, response, next);
// }

// function authorizeRequestAdmin(request, response, next) {
//     authorizeRequestHelper(true, request, response, next);
// }


// GET all journal entries
// , authorizeRequest
app.get("/journals", authorizeRequest, function(request, response){
    const userId = request.session.userId;

    let filter = { user: userId }; // must authorize the request first
    // let filter = {};
    let order = { entryDate: -1 };

    // Add any filters here based on request.query parameters
    // For example, filter by public/private entries, specific user, etc.

    model.Journal.find(filter).sort(order).then((journals) => {
        console.log("Journals from database:", journals);
        response.set("Access-Control-Allow-Origin", "*");
        response.json(journals);
    }).catch((error) => {
        console.error("Failed to retrieve journals:", error);
        response.sendStatus(500);
    });
    // if (request.query.public) {
    //     filter.public = request.query.public === 'true';
    // } else {
    //     filter.public = true;
    // }
});

// app.get("/journals", authorizeRequest, function(request, response) {
//     let filter = {};
//     let order = { entryDate: -1 };

//     // Add any filters here based on request.query parameters
//     // For example, filter by public/private entries, specific user, etc.

//     model.Journal.find(filter).sort(order).then((journals) => {
//         console.log("Journals from database:", journals);
//         response.json(journals);
//     }).catch((error) => {
//         console.error("Failed to retrieve journals:", error);
//         response.sendStatus(500);
//     });
// });

// GET/Retrieve a single journal entry
app.get("/journals/:journalID", authorizeRequest, function(request, response) {
    console.log("Request for journal with ID:", request.params.journalID);
    model.Journal.findOne({ _id: request.params.journalID }).then((journal) => {
        if (journal) {
            response.json(journal);
        } else {
            response.status(404).send("Journal entry not found.");
        }
    }).catch((error) => {
        console.error("Failed to query journal with ID:" + request.params.journalID, error);
        response.sendStatus(404);
    });
});

// POST/CREATE a new journal entry
app.post("/journals", authorizeRequest, function(request, response) {
    console.log("Request body:", request.body);
    const userId = request.session.userId;
    const newJournal = new model.Journal({
        username: request.body.username,
        entryTitle: request.body.entryTitle,
        entryBody: request.body.entryBody,
        entryDate: request.body.entryDate,
        entryTime: request.body.entryTime,
        moodRating: request.body.moodRating,
        public: request.body.public === 'true',
        user: userId
    });

    newJournal.save().then(() => {
        response.status(201).send("Created. New Journal entry added.");
    }).catch((error) => {
        console.error("Failed to save new journal entry", error);
        response.sendStatus(500);
    });
});

// PUT/UPDATE a journal entry
// app.put("/journals/:journalID", authorizeRequest, function(request, response) {
//     console.log("Request to update journal with ID:", request.params.journalID);
//     model.Journal.updateOne({ _id: request.params.journalID }, {
//         username: request.body.username,
//         entryTitle: request.body.entryTitle,
//         entryBody: request.body.entryBody,
//         entryDate: request.body.entryDate,
//         entryTime: request.body.entryTime,
//         moodRating: request.body.moodRating,
//         public: request.body.public,
//     }).then((result) => {
//         if (result.nModified > 0) {
//             response.status(200).send("Journal entry updated.");
//         } else {
//             response.status(404).send("Journal entry not found.");
//             console.log("Journal entry not found.");
//         }
//     }).catch((error) => {
//         console.error("Failed to update journal with ID:" + request.params.journalID, error);
//         response.sendStatus(404);
//     });
// });

// PUT/UPDATE a journal entry to toggle its public property
app.put("/journals/:journalID", authorizeRequest, function(request, response) {
    console.log("Request to update (toggle public status) journal with ID:", request.params.journalID);

    model.Journal.findById(request.params.journalID, function(err, journal) {
        if (err) {
            console.error("Error finding journal:", err);
            return response.status(500).send("Internal Server Error");
        }
        if (!journal) {
            return response.status(404).send("Journal entry not found.");
        }

        // Toggle the public status
        journal.public = !journal.public;

        journal.save(function(err) {
            if (err) {
                console.error("Error saving journal:", err);
                return response.status(500).send("Internal Server Error");
            }
            console.log("Journal public status toggled.");
            response.status(200).send("Journal entry updated.");
        });
    });
});


// DELETE a journal entry
app.delete("/journals/:journalID", authorizeRequest, function(request, response) {
    console.log("Request to delete journal with ID:", request.params.journalID);
    // if(req.user._id != request.params.journalID){
    //     response.status(401).send("Not authorized to delete this journal entry");
    model.Journal.deleteOne({ _id: request.params.journalID, user: request.user_id }).then((result) => {
        if (result.deletedCount > 0) {
            response.status(204).send("Journal entry deleted.");
        } else {
            response.status(404).send("Journal entry not found.");
        }
    }).catch((error) => {
        console.error("Failed to delete journal with ID:" + request.params.journalID, error);
        response.sendStatus(404);
    });
});

// GET all users
app.get("/users", function(request, response) {
    model.User.find().then((users) => {
        console.log("Users from database:", users);
        response.json(users);
    }).catch((error) => {
        console.error("Failed to retrieve users:", error);
        response.sendStatus(500);
    });
});

// GET/Retrieve a single user
app.get("/users/:userID", function(request, response) {
    console.log("Request for user with ID:", request.params.userId);
    model.User.findOne({ _id: request.params.userId }).then((user) => {
        if (user) {
            response.json(user);
        } else {
            response.status(404).send("User not found.");
        }
    }).catch((error) => {
        console.error("Failed to query user with ID:" + request.params.userId, error);
        response.sendStatus(404);
    });
});

// POST/CREATE a new user
app.post("/users", function(request, response) {
    console.log("Request body:", request.body);

    const newUser = new model.User({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        username: request.body.username
    })

    newUser.setEncryptedPassword(request.body.plainPassword).then(function(){
        // at this point, the password has been encrypted and assigned on the user
        newUser.save().then(() => {
            response.status(201).send("Created. New user added.");
        }).catch((error) => {
            if (error.errors) {
                var errorMessage = {};
                for (var fieldName in error.errors) {
                    errorMessage[fieldName] = error.errors[fieldName].message;
                }
                response.status(422).json(errorMessage);
            } else if (error.code === 11000) {
                response.status(409).send("Username or email already exists.");
            } else {
                console.error("Unknown error creating user:", error);
                response.status(500).send("Failed to save new user");
            }
        });
    });
});

//http://localhost:8080/journals/community
// get all community journals that are public
app.get("/journals/community", function(request, response) {
    let filter = { public: true };
    let order = { entryDate: -1 };

    model.Journal.find(filter).sort(order).then((journals) => {
        console.log("Community journals from database:", journals);
        response.json(journals);
    }).catch((error) => {
        console.error("Failed to retrieve community journals:", error);
        response.sendStatus(500);
    });
});

// retrieve session
// also commonly GET /me
//retrieve
app.get("/session", authorizeRequest, function (request, response) {
    console.log("session:", request.session)
    if (request.session && request.session.userId) {
        //logged in
        response.status(200).send("Authenticated")
    }
})

app.delete('/session', authorizeRequest, function(request, response) {
    request.session.userId = null;
    response.status(204).send("Logged Out");
});

//authentication: create session
app.post("/session", function (request, response) {
    model.User.findOne({ email: request.body.email })
        .then(function (user) {
            if (user) {
                user.verifyEncryptedPassword(request.body.plainPassword)
                    .then(function (match) {
                        if (match) {
                            // Save user's ID into session data
                            request.session.userId = user._id;
                            response.status(201).send("Authenticated");
                        } else {
                            response.status(401).send("Invalid email or password");
                        }
                    })
                    .catch(function (error) {
                        console.error("Error verifying password:", error);
                        response.status(500).send("Internal Server Error");
                    });
            } else {
                response.status(401).send("Invalid email or password");
            }
        })
        .catch(function (error) {
            console.error("Error finding user:", error);
            response.status(500).send("Internal Server Error");
        });
});

// PUT/UPDATE a user
app.put("/users/:userID", function(request, response) {
    console.log("Request to update user with ID:", request.params.userID);
    model.User.updateOne({ _id: request.params.userID }, {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        encryptedPassword: request.body.encryptedPassword,
        email: request.body.email,
    }).then((result) => {
        if (result.nModified > 0) {
            response.status(200).send("User updated.");
        } else {
            response.status(404).send("User not found.");
        }
    }).catch((error) => {
        console.error("Failed to update user with ID:" + request.params.userID, error);
        response.sendStatus(404);
    });
});

// DELETE a user
app.delete("/users/:userID", authorizeRequest, function(request, response) {
    console.log("Request to delete user with ID:", request.params.userID);
    model.User.deleteOne({ _id: request.params.userID }).then((result) => {
        if (result.deletedCount > 0) {
            console.log("User deleted");
            response.status(204).send("User deleted.");
        } else {
            response.status(404).send("User not found.");
        }
    }).catch((error) => {
        console.error("Failed to delete user with ID:" + request.params.userID, error);
        response.sendStatus(404);
    });
});

// Start the server
app.listen(8080, function() {
    console.log("Server is running...");
});
