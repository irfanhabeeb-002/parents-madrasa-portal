import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleLoginFormProps {
  onSuccess?: () => void;
}

export const SimpleLoginForm: React.FC<SimpleLoginFormProps> = ({ onSuccess }) => {
  const { login, loading, error, clearError } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) {
      return;
    }

    try {
      await login(phoneNumber);
      onSuccess?.();
    } catch (error) {
      // Error is handled by context
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-sm font-malayalam mt-1" lang="ml">
              ഉപയോക്താവ് രജിസ്റ്റർ ചെയ്തിട്ടില്ല. അഡ്മിനെ ബന്ധപ്പെടുക.
            </p>
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
          aria-label="Login to madrasa portal"
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

      {/* Demo Users Info */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 font-medium mb-2">Demo Users:</p>
        <div className="space-y-1 text-xs text-gray-500">
          <div>Abdul Rahman: <code>9876543210</code></div>
          <div>Fatima: <code>9123456780</code></div>
          <div>Muhammad: <code>9012345678</code></div>
        </div>
      </div>
    </div>
  );
};