import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { SignupCredentials } from '../../types/user';
import type { ConfirmationResult } from 'firebase/auth';

interface PhoneAuthFormProps {
    onSuccess?: () => void;
}

interface FormErrors {
    phone?: string;
    name?: string;
    otp?: string;
    general?: string;
}

type AuthStep = 'phone' | 'otp' | 'signup';

export const PhoneAuthForm: React.FC<PhoneAuthFormProps> = ({ onSuccess }) => {
    const { sendOTP, verifyOTP, loading, setupRecaptcha } = useAuth();
    const [step, setStep] = useState<AuthStep>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        // Setup reCAPTCHA when component mounts
        setupRecaptcha('recaptcha-container');
    }, [setupRecaptcha]);

    const validatePhone = (): boolean => {
        const newErrors: FormErrors = {};

        if (!phoneNumber) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^(\+880|880|0)?1[3-9]\d{8}$/.test(phoneNumber.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid Bangladeshi phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateName = (): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOTP = (): boolean => {
        const newErrors: FormErrors = {};

        if (!otp) {
            newErrors.otp = 'OTP is required';
        } else if (!/^\d{6}$/.test(otp)) {
            newErrors.otp = 'OTP must be 6 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePhone()) {
            return;
        }

        try {
            const confirmation = await sendOTP(phoneNumber);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (error: any) {
            if (error.message.includes('user-not-found') || error.message.includes('invalid-phone-number')) {
                setIsNewUser(true);
                setStep('signup');
            } else {
                setErrors({ general: error.message });
            }
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateOTP() || !confirmationResult) {
            return;
        }

        try {
            const userData = isNewUser ? { name, phone: phoneNumber } : undefined;
            await verifyOTP(confirmationResult, otp, userData);
            onSuccess?.();
        } catch (error: any) {
            if (error.message.includes('User data not found')) {
                setIsNewUser(true);
                setStep('signup');
            } else {
                setErrors({ general: error.message });
            }
        }
    };

    const handleSignupAndVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateName() || !validateOTP() || !confirmationResult) {
            return;
        }

        try {
            const userData: SignupCredentials = {
                name: name.trim(),
                phone: phoneNumber
            };
            await verifyOTP(confirmationResult, otp, userData);
            onSuccess?.();
        } catch (error: any) {
            setErrors({ general: error.message });
        }
    };

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        switch (field) {
            case 'phone':
                setPhoneNumber(value);
                break;
            case 'otp':
                setOtp(value);
                break;
            case 'name':
                setName(value);
                break;
        }

        // Clear field error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const renderPhoneStep = () => (
        <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handleInputChange('phone')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="01XXXXXXXXX"
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.phone}
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Enter your Bangladeshi mobile number
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
                {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
        </form>
    );

    const renderOTPStep = () => (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                </label>
                <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={handleInputChange('otp')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest ${errors.otp ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="000000"
                    maxLength={6}
                    aria-describedby={errors.otp ? 'otp-error' : undefined}
                    aria-invalid={!!errors.otp}
                />
                {errors.otp && (
                    <p id="otp-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.otp}
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    OTP sent to {phoneNumber}
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
                {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full py-2 px-4 text-gray-600 font-medium rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
                Change Phone Number
            </button>
        </form>
    );

    const renderSignupStep = () => (
        <form onSubmit={handleSignupAndVerify} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={handleInputChange('name')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="Enter your full name"
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.name}
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="otp-signup" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                </label>
                <input
                    id="otp-signup"
                    type="text"
                    value={otp}
                    onChange={handleInputChange('otp')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest ${errors.otp ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="000000"
                    maxLength={6}
                    aria-describedby={errors.otp ? 'otp-error' : undefined}
                    aria-invalid={!!errors.otp}
                />
                {errors.otp && (
                    <p id="otp-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.otp}
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    OTP sent to {phoneNumber}
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full py-2 px-4 text-gray-600 font-medium rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
                Change Phone Number
            </button>
        </form>
    );

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                {step === 'phone' ? 'Login / Sign Up' : step === 'otp' ? 'Verify OTP' : 'Complete Registration'}
            </h2>
            <p className="text-center text-gray-600 mb-6">
                {step === 'phone' ? 'মাদ্রাসা পোর্টালে প্রবেশ করুন' :
                    step === 'otp' ? 'OTP যাচাই করুন' : 'নিবন্ধন সম্পূর্ণ করুন'}
            </p>

            {errors.general && (
                <div
                    className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4"
                    role="alert"
                    aria-live="polite"
                >
                    {errors.general}
                </div>
            )}

            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOTPStep()}
            {step === 'signup' && renderSignupStep()}

            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>
        </div>
    );
};