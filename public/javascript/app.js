Vue.createApp({
    data() {
        return {
            userNotSignedIn: true,
            showUserNewEntry: true, // Initially, do not show the new journal entry form
            username: "",
            entryTitle: "",
            entryBody: "",
            entryDate: "",
            entryTime: "",
            newMoodRating: "",
            public: false,
            journals: [], // To store fetched journal entries
            showNewJournalInputs: false,
            journalsSearch: "",
            journalsSort: "entryDate", // Default sort by entry date
            errorMessages: {},
            newEntryTitle: "",
            newJournalEntry: "",  
            toggleSignInRegister: true,
            existingUserEmail: "",
            existingUserPassword: "",
            newUserFirstName: "",
            newUserLastName: "",
            newUserEmail: "", 
            newUserUsername: "",
            newUserPassword: "",
            SignInAndRegister: true,
            communityJournals: [],
            communityJournalsSwitch: false,
            currentJournalPublicStatus: false
        };
    },
    methods: {
        signOutOLD() {
            this.userNotSignedIn = true;
            this.username = "";
            this.entryTitle = "";
            this.entryBody = "";
            this.entryDate = "";
            this.entryTime = "";
            this.newMoodRating = "";
            this.public = false;
            this.journals = []; // Optionally clear the journals on sign out
        },
        signInPopup(){
            this.toggleSignInRegister = true;
        },
        registerPopup(){
            this.toggleSignInRegister = false;
        },

        signInOLD() {
            this.userNotSignedIn = false;
        },

        signIn() {
            var data = "email=" + encodeURIComponent(this.existingUserEmail);
            data += "&plainPassword=" + encodeURIComponent(this.existingUserPassword);
            fetch("http://localhost:8080/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: data,
                credentials: 'include',
            }).then((response) => {
                if (response.status == 201) {
                    console.log("Sign in successful");
                    this.existingUserEmail = "";
                    this.existingUserPassword = "";
                    this.loadJournals();
                    window.location.replace("http://localhost:8080/dashboard.html");
                    this.userNotSignedIn = false;
                } else {
                    // Handle server errors or validation errors returned from the server
                    console.log("Sign in failed");
                }
            });
        
        },

        registerNewUser() {
            const data = new URLSearchParams();
            data.append("firstName", this.newUserFirstName);
            data.append("lastName", this.newUserLastName);
            data.append("email", this.newUserEmail);
            data.append("username", this.newUserUsername);
            data.append("plainPassword", this.newUserPassword);

            fetch("http://localhost:8080/users", {
                method: "POST",
                body: data,
                headers: {
                    // "Content-Type": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: 'include',
            }).then((response) => {
                if (response.status == 201) {
                    this.newUserFirstName = "";
                    this.newUserLastName = "";
                    this.newUserEmail = "";
                    this.newUserUsername = "";
                    this.newPassword = "";
                } else {
                    // Handle server errors or validation errors returned from the server
                    console.log("Registration failed");
                    console.log(response);
                    console.log(data);
                }
            });
        },

        loadCommunityJournals() {
            fetch("http://localhost:8080/journals/community", {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            }).then((response) => {
                if (response.status == 200) {
                    response.json().then((data) => {
                        console.log("Community Journals from server:", data);
                        this.communityJournals = data;
                    });
                } else {
                    console.log("Error loading community journals");
                }
            });
        },

        communityJournalsSwitcher(){
            this.communityJournalsSwitch = true
            this.loadCommunityJournals();
            this.showUserNewEntry = false;
        },

        showNewJournal() {
            this.showUserNewEntry = true;
        },
        cancelJournal() {
            this.showUserNewEntry = false;
            // Optionally reset the journal entry form fields
            this.entryTitle = "";
            this.entryBody = "";
            this.entryDate = "";
            this.entryTime = "";
            this.newMoodRating = "";
            this.public = false;
        },
        addJournalEntry() {
            if (!this.validateJournal()) {
                return;
            }
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
            today = dd + '/' + mm + '/' + yyyy;
            
            var currentTime = new Date(); 
            var time = currentTime.getHours() + ":" + currentTime.getMinutes();
            var currentTime = new Date(); 
            var time = currentTime.getHours() + ":" + currentTime.getMinutes();

            // convert time from 24 hour to 12 hour format
            var hours = currentTime.getHours();
            var minutes = currentTime.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            time = hours + ':' + minutes + ' ' + ampm;


            var moodInt = 0;
            moodInt = parseInt(this.newMoodRating);

            const data = new URLSearchParams();
            data.append("username", this.username);
            data.append("entryTitle", this.newEntryTitle);
            data.append("entryBody", this.newJournalEntry);
            data.append("entryDate", today);
            data.append("entryTime", time);
            data.append("moodRating", moodInt);
            data.append("public", this.public);

            fetch("http://localhost:8080/journals", {
                method: "POST",
                body: data,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: 'include',
            }).then((response) => {
                if (response.status == 201) {
                    this.username = "";
                    this.newEntryTitle = "";
                    this.newJournalEntry = "";
                    this.entryDate = "";
                    this.entryTime = "";
                    this.newMoodRating = "";
                    this.public = false;
                    this.moodInt = 0;

                    this.loadJournals(); // Reload journals to include the new entry
                } else {
                    // Handle server errors or validation errors returned from the server
                }
            });
        },
        deleteJournalEntry(journalId) {
            fetch("http://localhost:8080/journals/" + journalId, {
                credentials: 'include',
                method: "DELETE",
            }).then((response) => {
                if (response.status == 204) {
                    // Journal deleted successfully, reload journals
                    this.loadJournals();
                } else {
                    // Handle server errors or journal not found
                }
            });
        },
        
        

        getSignedInUser() {
            fetch("http://localhost:8080/session", {
                credentials: 'include',
                method: "GET",
            }).then((response) => {
                if (response.status == 200) {
                    response.json().then((data) => {
                        this.username = data.username;
                        this.userNotSignedIn = false;
                        this.loadJournals();
                    });
                } else {
                    this.userNotSignedIn = true;
                }
            });
        },

        // loadJournals() {
        //     fetch("http://localhost:8080/journals", {
        //         credentials: 'include'
        //     }).then(response => {
        //         if (response.ok) {
        //             return response.json();
        //         } else {
        //             console.log("Server responded with status:", response.status);
        //             throw new Error('Network response was not ok.');
        //         }
        //     }).then(data => {
        //         console.log("Journals from server:", data);
        //     }).catch(error => {
        //         console.error("Fetch error:", error.message);
        //     });
        // },        

        loadSession () {
            fetch('http://localhost:8080/session').then((response) => {
                        if(response.status == 200) {
                            this.userNotSignedIn = false;
                            this.loadJournals();
                            console.log("session restored");
                        }
                    })
                },

        deleteSession () {
            fetch('http://localhost:8080/session', {
                method: 'DELETE',
            }).then((response) => {
                if(response.status == 204) {
                    this.userNotSignedIn = true;
                    this.username = "";
                    this.journals = [];
                    console.log("session deleted");
                    window.location.replace("http://localhost:8080/index.html");
                }
            })
        },

        loadJournals() {
            fetch("http://localhost:8080/journals/", {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            }).then((response) => {
                if (response.status == 200) {
                    response.json().then((data) => {
                        // checkUserAuthentication();
                        console.log("Journals from server:", data);
                        this.journals = data;
                    });
                } else {
                    console.log("Error loading journals");
                }
            });
        },

        checkUserAuthentication() {
            fetch('/session', {
                method: 'GET',
                credentials: 'include' // Important for including cookies/sessions
            })
            .then(response => response.json())
            .then(data => {
                if (data.isAuthenticated) {
                    document.getElementById('testerdiv').style.display = 'block';
                } else {
                    document.getElementById('testerdiv').style.display = 'none';
                }
            })
            .catch(error => console.error('Error checking authentication:', error));
        },
        
        // // Call this function on page load or when you need to check authentication
        // checkUserAuthentication();

        validateJournal() {
            this.errorMessages = {};
            if (this.newEntryTitle.length < 1) {
                this.errorMessages.newEntryTitle = "Journal Entry title is required";
            }
            if (this.newJournalEntry.length < 1) {
                this.errorMessages.newJournalEntry = "Entry body is required";
            }
            if (this.moodRating < 1 || this.newMoodRating > 5) {
                this.errorMessages.newMoodRating = "Mood rating must be between 1 and 5";
            }
            if (this.username.length < 1) {
                this.errorMessages.username = "Username is required";
            }
            return Object.keys(this.errorMessages).length == 0;
        },

        errorMessageForField: function(fieldName) {
            return this.errorMessages[fieldName];
        },

        errorStyleForField: function(fieldName) {
            if (this.errorMessages[fieldName]) {
                return {
                    color: "red"
                };
            }
        },
    },

    created() {
        console.log("App initialized");
        this.loadSession();
    },
}).mount('#app');
