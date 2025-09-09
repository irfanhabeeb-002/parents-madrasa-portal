import React, { useState, useEffect } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleLoginFormProps {
  onSuccess?: () => void;
}

export const SimpleLoginForm: React.FC<SimpleLoginFormProps> = ({ onSuccess }) => {
  const { 
    loginWithPhone, 
    loginWithEmail, 
    verifyOTP, 
    registerWithEmail,
    loading, 
    error, 
    clearError 
  } = useAuth();
  
  const [authMode, setAuthMode] = useState<'phone' | 'email' | 'register'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Clear errors when switching modes
  useEffect(() => {
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setOtpError('');
    clearError();
  }, [authMode, clearError]);

  const validatePhone = (): boolean => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const validatePassword = (): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const validateOtp = (): boolean => {
    if (!otp.trim()) {
      setOtpError('OTP is required');
      return false;
    }
    
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Please enter a valid 6-digit OTP');
      return false;
    }
    
    setOtpError('');
    return true;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) {
      return;
    }

    try {
      const result = await loginWithPhone(phoneNumber);
      setConfirmationResult(result);
    } catch (error: any) {
      // Error is handled by context, but we can also handle specific UI updates here
      console.error('Phone login failed:', error);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateOtp() || !confirmationResult) {
      return;
    }

    try {
      await verifyOTP(confirmationResult, otp);
      onSuccess?.();
    } catch (error: any) {
      // Error is handled by context, but we can also handle specific UI updates here
      console.error('OTP verification failed:', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail() || !validatePassword()) {
      return;
    }

    try {
      if (authMode === 'email') {
        await loginWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setEmailError('Display name is required for registration');
          return;
        }
        await registerWithEmail(email, password, displayName);
      }
      onSuccess?.();
    } catch (error: any) {
      // Error is handled by context, but we can also handle specific UI updates here
      console.error('Email authentication failed:', error);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Clear errors when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
    if (error) {
      clearError();
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      clearError();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (passwordError) {
      setPasswordError('');
    }
    if (error) {
      clearError();
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtp(value);
    
    if (otpError) {
      setOtpError('');
    }
    if (error) {
      clearError();
    }
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      clearError();
    }
  };

  // Show OTP verification form if confirmation result exists
  if (confirmationResult) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Verify OTP
          </h1>
          <p className="text-gray-600 font-malayalam" lang="ml">
            OTP സ്ഥിരീകരിക്കുക
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="otp" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              OTP Code
              <span className="block text-sm text-gray-500 font-malayalam" lang="ml">
                OTP കോഡ്
              </span>
            </label>
            
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              className={`
                w-full px-4 py-3 text-lg text-center border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                transition-colors duration-200 tracking-widest
                ${otpError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="123456"
              maxLength={6}
              aria-describedby={otpError ? 'otp-error' : undefined}
              aria-invalid={!!(otpError || error)}
              disabled={loading}
            />
            
            {otpError && (
              <p id="otp-error" className="mt-2 text-sm text-red-600" role="alert">
                {otpError}
              </p>
            )}
          </div>

          {error && (
            <div 
              className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 px-4 text-lg font-medium rounded-lg 
              transition-all duration-200 min-h-[48px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${loading 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
            aria-label="Verify OTP"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              <>
                Verify OTP
                <span className="block text-sm font-malayalam" lang="ml">
                  OTP സ്ഥിരീകരിക്കുക
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmationResult(null);
              setOtp('');
              setOtpError('');
              clearError();
            }}
            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to phone number
          </button>
        </form>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          {authMode === 'register' ? 'Register' : 'Login'}
        </h1>
        <p className="text-gray-600 font-malayalam" lang="ml">
          {authMode === 'register' ? 'രജിസ്റ്റർ' : 'ലോഗിൻ'}
        </p>
      </div>

      {/* Auth Mode Tabs */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setAuthMode('phone')}
          className={`
            flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all
            ${authMode === 'phone' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          Phone
          <span className="block text-xs font-malayalam" lang="ml">ഫോൺ</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('email')}
          className={`
            flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all
            ${authMode === 'email' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          Email
          <span className="block text-xs font-malayalam" lang="ml">ഇമെയിൽ</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className={`
            flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all
            ${authMode === 'register' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          Register
          <span className="block text-xs font-malayalam" lang="ml">രജിസ്റ്റർ</span>
        </button>
      </div>

      {/* Phone Authentication Form */}
      {authMode === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="phone" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number
              <span className="block text-sm text-gray-500 font-malayalam" lang="ml">
                ഫോൺ നമ്പർ
              </span>
            </label>
            
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={`
                w-full px-4 py-3 text-lg border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                transition-colors duration-200
                ${phoneError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="9876543210"
              maxLength={10}
              aria-describedby={phoneError ? 'phone-error' : undefined}
              aria-invalid={!!(phoneError || error)}
              disabled={loading}
            />
            
            {phoneError && (
              <p id="phone-error" className="mt-2 text-sm text-red-600" role="alert">
                {phoneError}
              </p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Enter your 10-digit mobile number
              <span className="block font-malayalam" lang="ml">
                നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക
              </span>
            </p>
          </div>

          {error && (
            <div 
              className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 px-4 text-lg font-medium rounded-lg 
              transition-all duration-200 min-h-[48px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${loading 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
            aria-label="Send OTP to phone"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending OTP...
              </div>
            ) : (
              <>
                Send OTP
                <span className="block text-sm font-malayalam" lang="ml">
                  OTP അയയ്ക്കുക
                </span>
              </>
            )}
          </button>

          {/* reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </form>
      )}

      {/* Email Authentication Form */}
      {(authMode === 'email' || authMode === 'register') && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label 
                htmlFor="displayName" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
                <span className="block text-sm text-gray-500 font-malayalam" lang="ml">
                  പൂർണ്ണ നാമം
                </span>
              </label>
              
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={handleDisplayNameChange}
                className={`
                  w-full px-4 py-3 text-lg border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 
                  transition-colors duration-200
                  ${emailError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
              <span className="block text-sm text-gray-500 font-malayalam" lang="ml">
                ഇമെയിൽ വിലാസം
              </span>
            </label>
            
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`
                w-full px-4 py-3 text-lg border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                transition-colors duration-200
                ${emailError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="user@example.com"
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={!!(emailError || error)}
              disabled={loading}
            />
            
            {emailError && (
              <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
              <span className="block text-sm text-gray-500 font-malayalam" lang="ml">
                പാസ്‌വേഡ്
              </span>
            </label>
            
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`
                w-full px-4 py-3 text-lg border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                transition-colors duration-200
                ${passwordError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Enter your password"
              aria-describedby={passwordError ? 'password-error' : undefined}
              aria-invalid={!!(passwordError || error)}
              disabled={loading}
            />
            
            {passwordError && (
              <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">
                {passwordError}
              </p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
              <span className="block font-malayalam" lang="ml">
                പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം
              </span>
            </p>
          </div>

          {error && (
            <div 
              className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 px-4 text-lg font-medium rounded-lg 
              transition-all duration-200 min-h-[48px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${loading 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
            aria-label={authMode === 'register' ? 'Register account' : 'Login with email'}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {authMode === 'register' ? 'Creating Account...' : 'Logging in...'}
              </div>
            ) : (
              <>
                {authMode === 'register' ? 'Create Account' : 'Login'}
                <span className="block text-sm font-malayalam" lang="ml">
                  {authMode === 'register' ? 'അക്കൗണ്ട് സൃഷ്ടിക്കുക' : 'ലോഗിൻ'}
                </span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};