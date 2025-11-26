import React, { createContext, useState, useContext, useEffect } from 'react';
import DBTable from '../handlers/DatabaseHandler';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const userTable = new DBTable('USER', 'User_ID', {});

    useEffect(() => {
        // Check authentication status on mount
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        setIsAuthenticated(!!token);
        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                // Ensure all required fields are present with default values
                const completeUser = {
                    User_ID: parsedUser.User_ID || '',
                    First_Name: parsedUser.First_Name || '',
                    Last_Name: parsedUser.Last_Name || '',
                    Nickname: parsedUser.Nickname || '',
                    Title: parsedUser.Title || '',
                    Gender: parsedUser.Gender || '',
                    Email_Address: parsedUser.Email_Address || '',
                    Tel: parsedUser.Tel || '',
                    User_Role: parsedUser.User_Role || 'Non_ATL_General',
                    direct_marketing: parsedUser.direct_marketing || false,
                    email_list: parsedUser.email_list || false,
                    card_id: parsedUser.card_id || '',
                    createdAt: parsedUser.createdAt || new Date().toISOString(),
                    lastLogin: parsedUser.lastLogin || new Date().toISOString()
                };
                setCurrentUser(completeUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                setCurrentUser(null);
            }
        }
    }, []);

    const login = async (email, password) => {
        const success = await userTable.handleLogin(email, password);
        if (success) {
            const user = userTable.getCurrentUser();
            if (user) {
                // Ensure all required fields are present with default values
                const completeUser = {
                    User_ID: user.User_ID || '',
                    First_Name: user.First_Name || '',
                    Last_Name: user.Last_Name || '',
                    Nickname: user.Nickname || '',
                    Title: user.Title || '',
                    Gender: user.Gender || '',
                    Email_Address: user.Email_Address || '',
                    Tel: user.Tel || '',
                    User_Role: user.User_Role || 'Non_ATL_General',
                    direct_marketing: user.direct_marketing || false,
                    email_list: user.email_list || false,
                    card_id: user.card_id || '',
                    createdAt: user.createdAt || new Date().toISOString(),
                    lastLogin: user.lastLogin || new Date().toISOString()
                };
                setCurrentUser(completeUser);
                setIsAuthenticated(true);
            }
        }
        return success;
    };

    const logout = () => {
        userTable.handleLogout();
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 