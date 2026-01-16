class DBTable {
    constructor(collection, ID, schema, columns = []) {
        this.collection = collection; // Uppercase name of the collection
        this.ID = ID; // Name of ID column
        this.schema = schema; // Object { Column: default value, including ID column }
        /* Sample schema
          const activitySchema = {
            Act_ID: "",
            CSSViewTransitionRule: "",
            Pointer: 0,
            Ending: 0,
            Questions: []
          };
        */
        this.column = columns; // Filter for columns to show; can be used as containers for additional parameters
    }

    handleRead = async (currentQuery = null, notif=true, filter = null) => {
        try {
            console.log(`${this.collection} Read:`, currentQuery ? `${this.ID} = ${currentQuery[this.ID]}` : 'all');
    
            const queryParams = new URLSearchParams({
                collection: this.collection,
                ID: this.ID,
                ...(currentQuery || {})
            }).toString();

            const token = localStorage.getItem('token');
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            console.log('Sending read request:', queryParams);
            const response = await fetch(`/api/database?${queryParams}`, {
                method: "GET",
                headers: headers,
            }); 
    
            if (response.ok) {
                const correspondent = await response.json();
                console.log('Raw response:', correspondent); // Debug log

                if (Array.isArray(correspondent)) {
                    return correspondent;
                } else if (correspondent && typeof correspondent === 'object') {
                    if (notif) alert(`The ${this.collection.toLowerCase()}'s profile has been read successfully!`);
                    
                    // Create a container with the response data
                    const container = { ...correspondent };
                    
                    // Remove MongoDB _id if it exists
                    if (container._id) {
                        delete container._id;
                    }
                    
                    console.log(`${this.collection} Read: currentQuery,`, container);
                    return container;
                }
                return null;
            } else {
                const errorData = await response.json();
                console.error('Read error:', errorData);
                if (notif) alert(`There was an error reading the ${this.collection.toLowerCase()}'s profile: ${errorData.message}`);
                return null;
            }
        } catch (error) {
            console.error("Network error:", error);
            if (notif) {
                if (error.message?.includes('Failed to fetch') || error.message?.includes('Connection refused')) {
                    alert("Cannot connect to the server. Please make sure the server is running and try again.");
                } else {
                    alert("Network error occurred. Please check your connection and try again.");
                }
            }
            return null;
        }
    };
    
    handleDelete = async (currentQuery, notif=true) => { // row
        try {
          console.log(`${this.collection} Delete: ${this.ID},`, currentQuery[this.ID]);
      
          const queryParams = new URLSearchParams({
              collection: this.collection,
              ID: this.ID
          }).toString();
      
          const token = localStorage.getItem('token');
          const headers = {
              "Content-Type": "application/json",
          };
          if (token) {
              headers["Authorization"] = `Bearer ${token}`;
          }

          const response = await fetch(`/api/database/${currentQuery[this.ID]}?${queryParams}`, {
              method: "DELETE",
              headers: headers,
          });
      
          if (response.ok) {
              if (notif) alert(`The ${this.collection.toLowerCase()}'s profile has been deleted successfully!`);
              return false;
          } else {
              if (notif) alert(`There was an error deleting the ${this.collection.toLowerCase()}'s profile. Please try again.`);
              return true;
          }
        } catch (error) {
          console.error("Network error:", error);
          if (notif) alert("Network error occurred. Please check your connection and try again.");
        }
    };
    
    handleWrite = async (currentQuery, notif=true) => { // row
        try {
          const queryID = {
            collection: this.collection,
            ID: this.ID,
            row: currentQuery
          };

          const token = localStorage.getItem('token');
          const headers = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          // Use different endpoints for user updates vs other operations
          let url = '/api/database';
          let method = 'POST';

          // For USER collection, only use update endpoint if we have a token (meaning user is logged in)
          if (this.collection === 'USER' && currentQuery[this.ID] && token) {
            // This is a user update (user is authenticated)
            url = `/api/user/${currentQuery[this.ID]}`;
            method = 'PUT';
            // Don't modify the queryID structure for user updates
          }

          console.log('🔍 Debug - Request details:');
          console.log('- URL:', url);
          console.log('- Method:', method);
          console.log('- Collection:', this.collection);
          console.log('- ID field:', this.ID);
          console.log('- QueryID object:', queryID);

          const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(queryID),
          });
    
          if (response.ok) {
              if (notif) alert(`The ${this.collection.toLowerCase()}'s profile has been written successfully!`);
              console.log(`${this.collection} Write: currentQuery,`, currentQuery);
              return false;
          } else {
              const errorData = await response.json();
              console.error('Write error:', errorData);
              if (notif) alert(`There was an error writing the ${this.collection.toLowerCase()}'s profile: ${errorData.message || 'Please try again.'}`);
              return true;
          }
        } catch (error) {
            console.error("Network error:", error);
            if (notif) alert("Network error occurred. Please check your connection and try again.");
            return true;
        }
    };

    handleLogin = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Login response status:', response.status);

            if (response.ok) {
                console.log('Login successful');
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                console.error('Login failed:', data.message);
                // Return error message for specific handling
                return { 
                    success: false, 
                    message: data.message || 'Login failed',
                    accountStatus: data.accountStatus // Will be 'pending_approval' for unapproved accounts
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    isAuthenticated = () => {
        return !!localStorage.getItem('token');
    };

    getCurrentUser = () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    };

    handleExists = async (currentQuery) => {
        try {
            const queryParams = new URLSearchParams({
                collection: this.collection,
                ID: this.ID
            }).toString();

            const token = localStorage.getItem('token');
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/database/${currentQuery[this.ID]}/exists?${queryParams}`, {
                method: "GET",
                headers: headers,
            });

            if (response.ok) {
                const data = await response.json();
                return data.exists;
            }
            return false;
        } catch (error) {
            console.error('Error checking ID:', error);
            return false;
        }
    };
}

const tableConfigs = {
    USER: {
        primaryKey: 'User_ID',
        defaultValues: {
            User_ID: "",
            First_Name: "",
            Last_Name: "",
            Nickname: "",
            Title: "",
            Gender: "",
            Email_Address: "",
            Tel: "",
            User_Role: "Non_ATL_General",
            direct_marketing: false,
            email_list: false,
            card_id: "",
            createdAt: new Date(),
            lastLogin: new Date()
        }
    },
    EVENT: {
        primaryKey: 'Event_ID',
        defaultValues: {
            Event_ID: "",
            Event_Title: "",
            Event_Type: "",
            Event_Desc: "",
            Event_StartDate: "",
            Event_EndDate: "",
            Host_ID: []
        }
    },
    ACTIVITY: {
        tableName: 'ACTIVITY',
        primaryKey: 'Act_ID',
        schema: {
            Act_ID: "LOADER",
            Title: "ATL Activity",
            Description: "",
            Questions: [{
                Type: "multiple-choice",
                Text: "",
                Options: [],  // For multiple-choice questions
                Answers: [],  // For textbox scored questions
                Scores: [],
                Required: true
            }],
            Settings: {
                Randomize_Questions: false,
                Show_Correct_Answers: false,
                Allow_Retry: false,
                Max_Attempts: 1,
                Time_Limit: 0
            },
            Pointer: 0,
            Ending: 0,
            Live: false,
            Creator_ID: [],
            Status: "draft",
            Schedule: {
                Start_Time: null,
                End_Time: null
            },
            Created_At: new Date(),
            Last_Updated: new Date()
        },
        defaultValues: {
            Act_ID: "",
            Title: "",
            Description: "",
            Questions: [],
            Pointer: 0,
            Ending: 0,
            Live: false,
            Settings: {
                Randomize_Questions: false,
                Show_Correct_Answers: false,
                Allow_Retry: false,
                Max_Attempts: 1,
                Time_Limit: 0
            },
            Status: "draft",
            Schedule: {
                Start_Time: null,
                End_Time: null
            },
            Creator_ID: [],
            Created_At: new Date(),
            Last_Updated: new Date()
        }
    },
    PARTICIPANT: {
        primaryKey: 'Parti_ID',
        defaultValues: {
            Parti_ID: "LOADER",
            User_ID: "",
            Act_ID: "",
            Nickname: "",
            Answers: [],
            Scores: [],
            Status: "joined",
            Last_Active: new Date(),
            Created_At: new Date(),
            Last_Updated: new Date()
        }
    },
    SURVEY: {
        primaryKey: 'Chat_ID',
        defaultValues: {
            Chat_ID: "",
            User_ID: "",
            User_Context: {
                Nickname: "",
                First_Name: "",
                Last_Name: "",
                Title: "",
                Gender: "",
                Email_Address: "",
                Tel: "",
                User_Role: ""
            },
            Survey_Responses: {
                overallExperience: {
                    question: "",
                    rating: 0
                },
                suggestions: {
                    question: "",
                    response: ""
                },
                primaryIntent: {
                    question: "",
                    response: ""
                }
            },
            Export_Metadata: {
                exported_at: new Date(),
                total_messages: 0,
                has_survey: true,
                survey_rating: 0,
                survey_suggestions: "",
                survey_primary_intent: "",
                chat_duration: 0
            },
            Chat_Messages: [],
            Created_At: new Date(),
            Updated_At: new Date()
        }
    }
};

export { tableConfigs };
export default DBTable;