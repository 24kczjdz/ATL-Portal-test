import './index.css';
import NavBar from './components/nav';
import ScrollToBottom from './components/ScrollToBottom';
import ScrollToTop from './components/ScrollToTop';
import QANavigation from './components/QANavigation';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Home from './pages/Home';
import ActivityHost from './pages/ActivityHost';
import USER from './pages/USER';
import UserManage from './pages/UserManage';
import EVENT from './pages/EVENT';
import ActivityManage from './pages/ActivityManage';
import Help from './pages/Help';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Chatbot from './pages/ChatBot';
import SurveyManage from './pages/SurveyManage';
import TokenManage from './pages/TokenManage';
import EquipmentBooking from './pages/EquipmentBooking';
import VenueBooking from './pages/VenueBooking';
import ManageBooking from './pages/ManageBooking';
import Projects from './pages/Projects';
import StudentInterestGroup from './pages/StudentInterestGroup';
import ManageProjects from './pages/ManageProjects';
import ManageStudentInterestGroup from './pages/ManageStudentInterestGroup';
import AdminDashboard from './pages/AdminDashboard';

// Live Activity Components
import JoinActivity from './pages/JoinActivity';
import LiveActivity from './pages/LiveActivity';
import LiveActivityDashboard from './pages/LiveActivityDashboard';

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    

    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }
        return children;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
            <NavBar />
            <ScrollToBottom />
            <ScrollToTop />
            <QANavigation />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.location.href = '/login'} />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                
                {/* Protected routes */}
                <Route path="/activity" element={
                    <ProtectedRoute>
                        <LiveActivityDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/activity/host" element={
                    <ProtectedRoute>
                        <ActivityHost />
                    </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                {/* Database management routes */}
                <Route path="/database/user" element={
                    <ProtectedRoute>
                        <UserManage />
                    </ProtectedRoute>
                } />
                <Route path="/database/user-basic" element={
                    <ProtectedRoute>
                        <USER />
                    </ProtectedRoute>
                } />
                <Route path="/database/event" element={
                    <ProtectedRoute>
                        <EVENT />
                    </ProtectedRoute>
                } />
                <Route path="/database/activity" element={
                    <ProtectedRoute>
                        <ActivityManage />
                    </ProtectedRoute>
                } />
                <Route path="/database/survey" element={
                    <ProtectedRoute>
                        <SurveyManage />
                    </ProtectedRoute>
                } />
                <Route path="/database/tokens" element={
                    <ProtectedRoute>
                        <TokenManage />
                    </ProtectedRoute>
                } />
                <Route path="/database/booking" element={
                   
                        <ManageBooking />
                   
                } />
                
                {/* Booking routes */}
                <Route path="/booking/equipment" element={
                   
                        <EquipmentBooking />
         
                } />
                <Route path="/booking/venue" element={
                    <ProtectedRoute>
                        <VenueBooking />
                    </ProtectedRoute>
                } />
                
                {/* Projects and SIG routes */}
                <Route path="/projects" element={
                    <ProtectedRoute>
                        <Projects />
                    </ProtectedRoute>
                } />
                <Route path="/student-interest-group" element={
                    <ProtectedRoute>
                        <StudentInterestGroup />
                    </ProtectedRoute>
                } />
                <Route path="/database/projects" element={
                    <ProtectedRoute>
                        <ManageProjects />
                    </ProtectedRoute>
                } />
                <Route path="/database/student-interest-group" element={
                    <ProtectedRoute>
                        <ManageStudentInterestGroup />
                    </ProtectedRoute>
                } />
                
                <Route path="/chatbot" element={
                    <ProtectedRoute>
                        <Chatbot />
                    </ProtectedRoute>
                } />
                <Route path="/help" element={
                    <ProtectedRoute>
                        <Help />
                    </ProtectedRoute>
                } />
                <Route path="/contact" element={
                    <ProtectedRoute>
                        <Contact />
                    </ProtectedRoute>
                } />
                
                {/* Live Activity Routes */}
                <Route path="/join" element={<JoinActivity />} />
                <Route path="/live/:pin" element={<LiveActivity />} />
                <Route path="/live/:pin/host" element={
                    <ProtectedRoute>
                        <LiveActivity />
                    </ProtectedRoute>
                } />
                <Route path="/live-dashboard" element={
                    <ProtectedRoute>
                        <LiveActivityDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;

// import './index.css';
// import NavBar from './components/nav';
// import ScrollToBottom from './components/ScrollToBottom';
// import ScrollToTop from './components/ScrollToTop';
// import QANavigation from './components/QANavigation';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import { ThemeProvider } from './contexts/ThemeContext';

// import Home from './pages/Home';
// import ActivityHost from './pages/ActivityHost';
// import USER from './pages/USER';
// import UserManage from './pages/UserManage';
// import EVENT from './pages/EVENT';
// import ActivityManage from './pages/ActivityManage';
// import Help from './pages/Help';
// import Contact from './pages/Contact';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Profile from './pages/Profile';
// import ForgotPassword from './components/auth/ForgotPassword';
// import ResetPassword from './components/auth/ResetPassword';
// import Chatbot from './pages/ChatBot';
// import SurveyManage from './pages/SurveyManage';
// import TokenManage from './pages/TokenManage';
// import EquipmentBooking from './pages/EquipmentBooking';
// import VenueBooking from './pages/VenueBooking';
// import ManageBooking from './pages/ManageBooking';
// import Projects from './pages/Projects';
// import StudentInterestGroup from './pages/StudentInterestGroup';
// import ManageProjects from './pages/ManageProjects';
// import ManageStudentInterestGroup from './pages/ManageStudentInterestGroup';
// import AdminDashboard from './pages/AdminDashboard';

// // Live Activity Components
// import JoinActivity from './pages/JoinActivity';
// import LiveActivity from './pages/LiveActivity';
// import LiveActivityDashboard from './pages/LiveActivityDashboard';

// function AppRoutes() {
//     const { isAuthenticated } = useAuth();
    

//     const ProtectedRoute = ({ children }) => {
//         if (!isAuthenticated) {
//             return <Navigate to="/login" />;
//         }
//         return children;
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
//             <NavBar />
//             <ScrollToBottom />
//             <ScrollToTop />
//             <QANavigation />
//             <Routes>
//                 {/* Public routes */}
//                 <Route path="/" element={<Home />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.location.href = '/login'} />} />
//                 <Route path="/auth/reset-password" element={<ResetPassword />} />
                
//                 {/* Protected routes */}
//                 <Route path="/activity" element={
//                     <ProtectedRoute>
//                         <LiveActivityDashboard />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/profile" element={
//                     <ProtectedRoute>
//                         <Profile />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/activity/host" element={
//                     <ProtectedRoute>
//                         <ActivityHost />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/admin-dashboard" element={
//                     <ProtectedRoute>
//                         <AdminDashboard />
//                     </ProtectedRoute>
//                 } />
//                 {/* Database management routes */}
//                 <Route path="/database/user" element={
//                     <ProtectedRoute>
//                         <UserManage />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/user-basic" element={
//                     <ProtectedRoute>
//                         <USER />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/event" element={
//                     <ProtectedRoute>
//                         <EVENT />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/activity" element={
//                     <ProtectedRoute>
//                         <ActivityManage />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/survey" element={
//                     <ProtectedRoute>
//                         <SurveyManage />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/tokens" element={
//                     <ProtectedRoute>
//                         <TokenManage />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/booking" element={
//                     <ProtectedRoute>
//                         <ManageBooking />
//                     </ProtectedRoute>
//                 } />
                
//                 {/* Booking routes */}
//                 <Route path="/booking/equipment" element={
//                     <ProtectedRoute>
//                         <EquipmentBooking />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/booking/venue" element={
//                     <ProtectedRoute>
//                         <VenueBooking />
//                     </ProtectedRoute>
//                 } />
                
//                 {/* Projects and SIG routes */}
//                 <Route path="/projects" element={
//                     <ProtectedRoute>
//                         <Projects />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/student-interest-group" element={
//                     <ProtectedRoute>
//                         <StudentInterestGroup />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/projects" element={
//                     <ProtectedRoute>
//                         <ManageProjects />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/database/student-interest-group" element={
//                     <ProtectedRoute>
//                         <ManageStudentInterestGroup />
//                     </ProtectedRoute>
//                 } />
                
//                 <Route path="/chatbot" element={
//                     <ProtectedRoute>
//                         <Chatbot />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/help" element={
//                     <ProtectedRoute>
//                         <Help />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/contact" element={
//                     <ProtectedRoute>
//                         <Contact />
//                     </ProtectedRoute>
//                 } />
                
//                 {/* Live Activity Routes */}
//                 <Route path="/join" element={<JoinActivity />} />
//                 <Route path="/live/:pin" element={<LiveActivity />} />
//                 <Route path="/live/:pin/host" element={
//                     <ProtectedRoute>
//                         <LiveActivity />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/live-dashboard" element={
//                     <ProtectedRoute>
//                         <LiveActivityDashboard />
//                     </ProtectedRoute>
//                 } />
//             </Routes>
//         </div>
//     );
// }

// function App() {
//     return (
//         <Router>
//             <ThemeProvider>
//                 <AuthProvider>
//                     <AppRoutes />
//                 </AuthProvider>
//             </ThemeProvider>
//         </Router>
//     );
// }

// export default App;
