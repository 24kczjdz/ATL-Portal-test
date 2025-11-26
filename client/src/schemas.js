export const userSchema = {
    User_ID: "",
    First_Name: "",
    Last_Name: "",
    Nickname: "",
    Title: "",
    Gender: "",
    Email_Address: "",
    Password: "",
    Tel: "",
    User_Role: "Non_ATL_General", // Default role
    ATL_Member: false,
    Member_ID: "",
    UID: "",
    direct_marketing: false,
    email_list: false,
    card_id: "",
    createdAt: new Date(),
    lastLogin: new Date()
};

// Add other schemas here as needed
// Example:
// export const equipmentSchema = {
//     Equipment_ID: "",
//     Name: "",
//     Description: "",
//     Status: "",
//     // ... other fields
// }; 