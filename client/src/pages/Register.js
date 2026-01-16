import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DBTable from '../handlers/DatabaseHandler';
import { userSchema } from '../schemas';
import { Card, Button, Input, Alert, Badge } from '../components/ui';
import { FiUser, FiMail, FiLock, FiPhone, FiUserPlus } from 'react-icons/fi';

// Country codes for telephone field
const countryCodes = [
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' }
];

function Register() {
    const [formData, setFormData] = useState({
        Username: '',
        First_Name: '',
        Last_Name: '',
        Email_Address: '',
        Password: '',
        ConfirmPassword: '',
        Nickname: '',
        Title: '',
        Gender: '',
        countryCode: '+852',
        Tel: '',
        User_Role: 'Non_ATL_General',
        ATL_Member: false,
        Member_ID: '',
        UID: '',
        direct_marketing: false,
        email_list: false,
        card_id: '',
        adminToken: '',
        createdAt: new Date(),
        lastLogin: new Date()
    });
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isAdminRegistration, setIsAdminRegistration] = useState(false);
    const navigate = useNavigate();
    const userTable = new DBTable('USER', 'User_ID', userSchema);

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[@$!%*?&]/.test(password)
        };

        const errors = [];
        if (!requirements.minLength) errors.push('At least 8 characters');
        if (!requirements.hasUppercase) errors.push('One uppercase letter');
        if (!requirements.hasLowercase) errors.push('One lowercase letter');
        if (!requirements.hasNumber) errors.push('One number');
        if (!requirements.hasSpecial) errors.push('One special character (@$!%*?&)');

        return {
            isValid: Object.values(requirements).every(Boolean),
            errors,
            requirements
        };
    };

    const validateRequiredFields = () => {
        const errors = {};
        const requiredFields = ['Username', 'First_Name', 'Last_Name', 'Email_Address', 'Gender', 'Password'];
        
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                errors[field] = `${field.replace('_', ' ')} is required`;
            }
        });
        
        // Special validation for email format
        if (formData.Email_Address && !/\S+@\S+\.\S+/.test(formData.Email_Address)) {
            errors.Email_Address = 'Please enter a valid email address';
        }
        
        // Username validation
        if (formData.Username && formData.Username.length < 3) {
            errors.Username = 'Username must be at least 3 characters long';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Validate password when it changes
        if (name === 'Password') {
            const { isValid, errors, requirements } = validatePassword(value);
            setPasswordError(isValid ? '' : `Password must contain: ${errors.join(', ')}`);
            
            // Update password requirements display
            setPasswordRequirements({
                minLength: requirements.minLength,
                hasUppercase: requirements.hasUppercase,
                hasLowercase: requirements.hasLowercase,
                hasNumber: requirements.hasNumber,
                hasSpecial: requirements.hasSpecial
            });
        }
    };

    // Add state for password requirements
    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
    });

    const validateForm = () => {
        // Validate required fields first
        if (!validateRequiredFields()) {
            setError('Please fill in all required fields correctly');
            return false;
        }
        
        // Validate password
        const { isValid, errors } = validatePassword(formData.Password);
        if (!isValid) {
            setError(`Password must contain: ${errors.join(', ')}`);
            return false;
        }

        if (formData.Password !== formData.ConfirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Check if admin registration requires token
        if (isAdminRegistration && !formData.adminToken.trim()) {
            setError('Admin registration token is required');
            return false;
        }

        // Validate ATL Member ID if user is ATL member
        if (formData.ATL_Member && !formData.Member_ID.trim()) {
            setError('ATL Member ID is required for ATL members');
            return false;
        }

        // Validate UID for HKU Staff and Students
        const hkuRoles = ['ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'Non_ATL_HKU_Staff', 'Non_ATL_HKU_Student'];
        if (hkuRoles.includes(formData.User_Role) && !formData.UID.trim()) {
            setError('HKU UID is required for HKU Staff and Students');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            if (isAdminRegistration) {
                // Use admin registration endpoint
                const response = await fetch('/api/auth/register-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        User_ID: formData.Username,
                        Email_Address: formData.Email_Address,
                        Password: formData.Password,
                        First_Name: formData.First_Name,
                        Last_Name: formData.Last_Name,
                        Nickname: formData.Nickname,
                        Title: formData.Title,
                        Gender: formData.Gender,
                        Tel: `${formData.countryCode}${formData.Tel}`,
                        User_Role: formData.User_Role,
                        ATL_Member: formData.ATL_Member,
                        Member_ID: formData.Member_ID,
                        UID: formData.UID,
                        direct_marketing: formData.direct_marketing,
                        email_list: formData.email_list,
                        adminToken: formData.adminToken
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Store token and redirect
                    localStorage.setItem('token', data.token);
                    alert('Admin account created successfully!');
                    navigate('/');
                } else {
                    setError(data.message || 'Failed to create admin account');
                }
            } else {
                // Regular registration - create unapproved account
                const { ConfirmPassword, adminToken, countryCode, ...userData } = formData;
                // Combine country code with phone number
                userData.Tel = `${formData.countryCode}${formData.Tel}`;
                // Use Username as User_ID
                userData.User_ID = formData.Username;
                // Set approved to false for new registrations
                userData.approved = false;
                
                const success = await userTable.handleWrite(userData);
                
                if (!success) {
                    // Show success message
                    alert('Registration submitted successfully! Please check your email for further instructions. You will need to visit the Arts Tech Lab at Run Run Shaw Tower 4.40-4.41 with your student ID card to complete the registration process.');
                    navigate('/login');
                } else {
                    setError('Failed to create account. Please try again.');
                }
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error('Registration error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-2xl w-full">
                <Card.Header className="text-center">
                    <Card.Title className="text-3xl font-elegant text-primary-900 dark:text-white">
                        Create your account
                    </Card.Title>
                    <Card.Description className="font-literary text-primary-600 dark:text-gray-300">
                        Fields marked with <span className="text-error-500 font-medium">*</span> are required
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <Input
                            label="Username"
                            name="Username"
                            type="text"
                            required
                            placeholder="Enter your username (min 3 characters)"
                            value={formData.Username}
                            onChange={handleChange}
                            icon={FiUser}
                            error={validationErrors.Username}
                            helperText="Must be at least 3 characters long, letters and numbers only"
                        />
                        <Input
                            label="First Name"
                            name="First_Name"
                            type="text"
                            required
                            placeholder="Enter your first name"
                            value={formData.First_Name}
                            onChange={handleChange}
                            icon={FiUser}
                            error={validationErrors.First_Name}
                        />
                        <Input
                            label="Last Name"
                            name="Last_Name"
                            type="text"
                            required
                            placeholder="Enter your last name"
                            value={formData.Last_Name}
                            onChange={handleChange}
                            icon={FiUser}
                            error={validationErrors.Last_Name}
                        />
                        <Input
                            label="Title"
                            name="Title"
                            type="text"
                            placeholder="e.g., Dr., Prof., Mr., Ms."
                            value={formData.Title}
                            onChange={handleChange}
                        />
                        <Input
                            label="Email Address"
                            name="Email_Address"
                            type="email"
                            required
                            placeholder="Enter your email address (e.g., user@example.com)"
                            value={formData.Email_Address}
                            onChange={handleChange}
                            icon={FiMail}
                            error={validationErrors.Email_Address}
                            helperText="Must be a valid email format (e.g., user@example.com)"
                        />
                        <Input
                            label="Nickname"
                            name="Nickname"
                            type="text"
                            placeholder="Enter your preferred nickname"
                            value={formData.Nickname}
                            onChange={handleChange}
                            icon={FiUser}
                        />
                        <div>
                            <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                Gender <span className="text-error-500">*</span>
                            </label>
                            <select
                                id="Gender"
                                name="Gender"
                                required
                                className={`w-full px-4 py-3 font-literary border rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white placeholder-primary-400 dark:placeholder-gray-500 transition-all duration-300 ${
                                    validationErrors.Gender 
                                        ? 'border-error-300 dark:border-error-600 focus:border-error-500 focus:ring-error-500/20' 
                                        : 'border-primary-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500/20 dark:focus:ring-primary-400/20'
                                } focus:outline-none focus:ring-4`}
                                value={formData.Gender}
                                onChange={handleChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                            {validationErrors.Gender && (
                                <p className="mt-1 text-sm font-sans text-error-600 dark:text-error-400">{validationErrors.Gender}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                Telephone
                            </label>
                            <div className="flex">
                                <select
                                    name="countryCode"
                                    className="appearance-none block px-4 py-3 border border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary-900 dark:text-white rounded-l-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 font-literary transition-all duration-300"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                    style={{ minWidth: '120px' }}
                                >
                                    {countryCodes.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    id="Tel"
                                    name="Tel"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    className="appearance-none flex-1 block w-full px-4 py-3 border border-l-0 border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-800 placeholder-primary-400 dark:placeholder-gray-500 text-primary-900 dark:text-white rounded-r-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 font-literary transition-all duration-300"
                                    value={formData.Tel}
                                    onChange={handleChange}
                                />
                            </div>
                            <p className="mt-2 text-xs font-sans text-primary-500 dark:text-gray-400">
                                Format: {formData.countryCode === '+852' ? '12345678 (8 digits, Hong Kong)' : 
                                        formData.countryCode === '+1' ? '1234567890 (10 digits, US/Canada)' : 
                                        formData.countryCode === '+44' ? '1234567890 (10-11 digits, UK)' : 
                                        'Enter digits only (no spaces or dashes)'}
                            </p>
                        </div>
                        <div>
                            <Input
                                label="Password"
                                name="Password"
                                type="password"
                                required
                                value={formData.Password}
                                onChange={handleChange}
                                icon={FiLock}
                                error={passwordError || validationErrors.Password}
                                showPasswordToggle
                            />
                            <div className="mt-3 p-4 bg-primary-50 dark:bg-gray-700 rounded-lg">
                                <p className="font-serif font-medium text-primary-900 dark:text-white mb-2">Password Requirements:</p>
                                <ul className="space-y-1">
                                    <li className={`flex items-center font-literary text-sm ${
                                        passwordRequirements.minLength ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-gray-400'
                                    }`}>
                                        <span className="mr-2">{passwordRequirements.minLength ? '✓' : '○'}</span>
                                        At least 8 characters
                                    </li>
                                    <li className={`flex items-center font-literary text-sm ${
                                        passwordRequirements.hasUppercase ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-gray-400'
                                    }`}>
                                        <span className="mr-2">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
                                        One uppercase letter (A-Z)
                                    </li>
                                    <li className={`flex items-center font-literary text-sm ${
                                        passwordRequirements.hasLowercase ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-gray-400'
                                    }`}>
                                        <span className="mr-2">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
                                        One lowercase letter (a-z)
                                    </li>
                                    <li className={`flex items-center font-literary text-sm ${
                                        passwordRequirements.hasNumber ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-gray-400'
                                    }`}>
                                        <span className="mr-2">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                                        One number (0-9)
                                    </li>
                                    <li className={`flex items-center font-literary text-sm ${
                                        passwordRequirements.hasSpecial ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-gray-400'
                                    }`}>
                                        <span className="mr-2">{passwordRequirements.hasSpecial ? '✓' : '○'}</span>
                                        One special character (@$!%*?&)
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <Input
                            label="Confirm Password"
                            name="ConfirmPassword"
                            type="password"
                            required
                            value={formData.ConfirmPassword}
                            onChange={handleChange}
                            icon={FiLock}
                            error={formData.Password !== formData.ConfirmPassword ? 'Passwords do not match' : ''}
                            showPasswordToggle
                        />
                        <div>
                            <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-4">Account Type</label>
                            <div className="space-y-3">
                                <label className="flex items-center p-3 border border-primary-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="regular"
                                        checked={!isAdminRegistration}
                                        onChange={() => {
                                            setIsAdminRegistration(false);
                                            setFormData(prev => ({ ...prev, User_Role: 'Mem', adminToken: '' }));
                                        }}
                                        className="mr-3 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="font-literary text-primary-900 dark:text-white">Regular Account</span>
                                </label>
                                <label className="flex items-center p-3 border border-primary-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="admin"
                                        checked={isAdminRegistration}
                                        onChange={() => {
                                            setIsAdminRegistration(true);
                                            setFormData(prev => ({ ...prev, User_Role: 'ATL_ADMIN' }));
                                        }}
                                        className="mr-3 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div>
                                        <span className="font-literary text-primary-900 dark:text-white">Admin Account</span>
                                        <p className="text-sm text-primary-500 dark:text-gray-400">(requires token)</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {!isAdminRegistration && (
                            <>
                                <div>
                                    <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-4">ATL Membership</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center p-3 border border-primary-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="ATL_Member"
                                                value="true"
                                                checked={formData.ATL_Member === true}
                                                onChange={() => setFormData(prev => ({ ...prev, ATL_Member: true }))}
                                                className="mr-3 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-literary text-primary-900 dark:text-white">ATL Member</span>
                                        </label>
                                        <label className="flex items-center p-3 border border-primary-200 dark:border-gray-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="ATL_Member"
                                                value="false"
                                                checked={formData.ATL_Member === false}
                                                onChange={() => setFormData(prev => ({ ...prev, ATL_Member: false }))}
                                                className="mr-3 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-literary text-primary-900 dark:text-white">Non-ATL Member</span>
                                        </label>
                                    </div>
                                </div>

                                {formData.ATL_Member && (
                                    <Input
                                        label="ATL Member ID"
                                        name="Member_ID"
                                        type="text"
                                        required
                                        placeholder="Enter your ATL Member ID (e.g., ATL2024001)"
                                        value={formData.Member_ID}
                                        onChange={handleChange}
                                        helperText="Must be a valid ATL Member ID (e.g., ATL2024001)"
                                    />
                                )}

                                <div>
                                    <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Role</label>
                                    <select
                                        id="User_Role"
                                        name="User_Role"
                                        className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                        value={formData.User_Role}
                                        onChange={handleChange}
                                    >
                                        {formData.ATL_Member ? (
                                            <>
                                                <option value="ATL_Member_HKU_Staff">ATL Member - HKU Staff</option>
                                                <option value="ATL_Member_HKU_Student">ATL Member - HKU Student</option>
                                                <option value="ATL_Member_General">ATL Member - General</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Non_ATL_HKU_Staff">Non-ATL - HKU Staff</option>
                                                <option value="Non_ATL_HKU_Student">Non-ATL - HKU Student</option>
                                                <option value="Non_ATL_General">Non-ATL - General User</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {['ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'Non_ATL_HKU_Staff', 'Non_ATL_HKU_Student'].includes(formData.User_Role) && (
                                    <Input
                                        label="HKU UID"
                                        name="UID"
                                        type="text"
                                        required
                                        placeholder="Enter your HKU UID (e.g., 3031234567)"
                                        value={formData.UID}
                                        onChange={handleChange}
                                        helperText="Must be a valid HKU UID (10 digits, e.g., 3031234567)"
                                    />
                                )}
                            </>
                        )}

                        {isAdminRegistration && (
                            <Input
                                label="Admin Registration Token"
                                name="adminToken"
                                type="text"
                                required={isAdminRegistration}
                                placeholder="Enter admin registration token"
                                value={formData.adminToken}
                                onChange={handleChange}
                                helperText="You need a valid admin registration token to create an admin account."
                            />
                        )}

                        {/* Marketing Preferences */}
                        <div className="border-t border-primary-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-4">Marketing Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-start p-4 border border-primary-200 dark:border-gray-600 rounded-lg">
                                    <div className="flex items-center h-5 mt-0.5">
                                        <input
                                            id="direct_marketing"
                                            name="direct_marketing"
                                            type="checkbox"
                                            checked={formData.direct_marketing}
                                            onChange={handleChange}
                                            className="focus:ring-primary-500 dark:focus:ring-primary-400 h-4 w-4 text-primary-600 border-primary-300 dark:border-gray-600 rounded"
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <label htmlFor="direct_marketing" className="font-serif font-medium text-primary-900 dark:text-white">
                                            Direct Marketing
                                        </label>
                                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">I agree to receive direct marketing communications from ATL</p>
                                    </div>
                                </div>
                                <div className="flex items-start p-4 border border-primary-200 dark:border-gray-600 rounded-lg">
                                    <div className="flex items-center h-5 mt-0.5">
                                        <input
                                            id="email_list"
                                            name="email_list"
                                            type="checkbox"
                                            checked={formData.email_list}
                                            onChange={handleChange}
                                            className="focus:ring-primary-500 dark:focus:ring-primary-400 h-4 w-4 text-primary-600 border-primary-300 dark:border-gray-600 rounded"
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <label htmlFor="email_list" className="font-serif font-medium text-primary-900 dark:text-white">
                                            Email List
                                        </label>
                                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">I agree to receive email newsletters and updates from ATL</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert type="error">
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        icon={FiUserPlus}
                    >
                        Create Account
                    </Button>
                </form>
                </Card.Content>
                <Card.Footer className="text-center">
                    <p className="font-literary text-primary-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-serif text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </Card.Footer>
            </Card>
        </div>
    );
}

export default Register; 