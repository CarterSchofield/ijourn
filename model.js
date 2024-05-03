const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const { request } = require('express');
mongoose.connect('mongodb+srv://SE4200:cCVQfncmhq9Z7cMX@cluster0.4dntofl.mongodb.net/journal?retryWrites=true&w=majority')

const JournalSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    entryTitle: {
        type: String,
        required: [true, 'Entry title is required']
    },
    entryBody: {
        type: String,
        required: [true, 'Entry body is required']
    },
    entryDate: {
        type: String,
        required: [true, 'Entry date is required'],
        validate: {
            validator: function(v) {
                return /\d{2}\/\d{2}\/\d{4}/.test(v);
            },
            message: props => `${props.value} is not a valid date!`
        }
    },
    entryTime: {
        type: String,
        required: [true, 'Entry time is required'],
        validate: {
            validator: function(v) {
                return /\d{2}:\d{2}/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        }
    },
    moodRating: {
        type: Number,
        required: [true, 'Mood rating is required'],
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 5;
            },
            message: props => `${props.value} is not a valid rating!`
        }
    },
    public: {
        type: Boolean,
        required: [true, 'Public is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Journal entry must be associated with a user.']
    }
});

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required.']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required.']
    },
    username: {
        type: String,
        required: [true, 'Username is required.']
    },
    encryptedPassword: {
        type: String,
        required: [true, 'Password is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true //not a normal Mongoose validator! But a database constraint
    }
    // others Role field, like 'admin', 'user', 'mod', etc.
    // and other fields
// });
} , {
        toJSON: {
            versionKey: false,
            transform: function(doc, ret) {
                // remove the encryptedPassword property when serializing doc to JSON
                delete ret.encryptedPassword;
                delete ret.email;
        }
    }
});

// encrypt given plain password and store into model instance
userSchema.methods.setEncryptedPassword = function(plainPassword) {

    var promise = new Promise((resolve, reject) => {
        // resolve is then()
        // reject is catch()

        bcrypt.hash(plainPassword, 12).then(hash => {
            // Set the encryptedPassword value on the model instance
            this.encryptedPassword = hash;
            // resolve the promise
            resolve(); // this invokes the caller's then() function
        });
    });

    return promise;
};

// verify an attempted password against the stored encrypted password
userSchema.methods.verifyEncryptedPassword = function(plainPassword) {
    var promise = new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
            resolve(result);
        });
    });
    return promise
}

const Journal = mongoose.model('Journal', JournalSchema);
const User = mongoose.model('User', userSchema);

module.exports = {
    Journal: Journal,
    User: User
}