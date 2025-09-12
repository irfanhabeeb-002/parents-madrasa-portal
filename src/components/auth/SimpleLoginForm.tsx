import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleLoginFormProps {
  onSuccess?: () => void;
}

export const SimpleLoginForm: React.FC<SimpleLoginFormProps> = ({ onSuccess }) => {
  const { 
    loginWithPhone, 
    loading, 
    error, 
    clearError 
  } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Clear errors when component mounts
  useEffect(() => {
    setPhoneError('');
    clearError();
  }, [clearError]);

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) {
      return;
    }

    try {
      await loginWithPhone(phoneNumber);
      onSuccess?.();
    } catch (error: any) {
      // Error is handled by context, but we can also handle specific UI updates here
      console.error('Phone login failed:', error);
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

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          Login
        </h1>
        <p className="text-gray-600 font-malayalam" lang="ml">
          ലോഗിൻ
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Enter your registered phone number
        </p>
      </div>

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
            Enter your 10-digit mobile number (no OTP required)
            <span className="block font-malayalam" lang="ml">
              നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക (OTP ആവശ്യമില്ല)
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
          aria-label="Login with phone number"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Logging in...
            </div>
          ) : (
            <>
              Login
              <span className="block text-sm font-malayalam" lang="ml">
                ലോഗിൻ
              </span>
            </>
          )}
        </button>
      </form>

      {/* Demo users info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 font-medium mb-2">Demo Users:</p>
        <div className="text-xs text-blue-700 space-y-1">
          <p>8078769771 - Abdul Shukkoor</p>
          <p>9400095648 - Muneer Jabbar</p>
          <p>9388839617 - Sageer Manath</p>
          <p>9387110300 - Rafeek M I</p>
          <p>9895820756 - Yousuf B S</p>
          <p>7025021695 - Irfan Habeeb</p>
          <p>9447183133 - Abdul Rasheed</p>
        </div>
      </div>
    </div>
  );
};