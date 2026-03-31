import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

export const Login = ({ 
  onLoginSuccess, 
  onGoToPublic, 
  t,
  initialRequirePasswordChange = false,
  initialTempUser = null,
  isPublicMode = false,
  initialIsRegistering = undefined
}: { 
  onLoginSuccess: (user: any) => void, 
  onGoToPublic: () => void, 
  t: any,
  initialRequirePasswordChange?: boolean,
  initialTempUser?: any,
  isPublicMode?: boolean,
  initialIsRegistering?: boolean
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const config = await api.get('/public/config');
      setSystemConfig(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };
  
  const [requirePasswordChange, setRequirePasswordChange] = useState(initialRequirePasswordChange);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<any>(initialTempUser);
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering !== undefined ? initialIsRegistering : isPublicMode);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.token);
      
      if (response.user.requirePasswordChange) {
        setRequirePasswordChange(true);
        setTempUser(response.user);
      } else {
        onLoginSuccess(response.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/public-register', { 
        email, 
        password,
        displayName,
        phoneNumber
      });
      localStorage.setItem('token', response.token);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { 
        currentPassword: password, 
        newPassword 
      });
      
      // Update user object to remove requirePasswordChange flag
      const updatedUser = { ...tempUser, requirePasswordChange: false };
      onLoginSuccess(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (requirePasswordChange) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
            <KeyRound size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Change Password</h1>
            <p className="text-slate-500 mt-2 text-sm">
              You are logging in with a temporary password. Please set a new permanent password to continue.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 text-lg bg-amber-600 text-white hover:bg-amber-700 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
          <ShieldCheck size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            {isPublicMode 
              ? (isRegistering ? 'Identity Setup' : 'System Access')
              : (isRegistering ? 'Identity Setup' : 'Admin Gateway')}
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {isPublicMode
              ? (isRegistering ? 'Initialize your citizen profile to access the ecosystem.' : 'Securely authenticate to your dashboard.')
              : (isRegistering ? 'Initialize your citizen profile to access the ecosystem.' : 'Authorized personnel only.')}
          </p>
          
          {isPublicMode && isRegistering && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-left">
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Who can submit?</strong> Any citizen or party member can submit a grievance. 
                <br />
                <strong>Why register?</strong> Registration allows you to securely track the status of your submission and receive direct updates from our team.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 text-left">
          {isRegistering && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="+977..."
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder={isRegistering || isPublicMode ? "you@example.com" : `admin@${systemConfig['PARTY_NAME']?.toLowerCase().replace(/\s+/g, '') || 'nup'}.org`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="••••••••"
              minLength={isRegistering ? 6 : undefined}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Register' : 'Sign In')}
          </button>
        </form>

        <div className="text-sm text-slate-500">
          {isRegistering ? (
            <p>Already have an account? <button onClick={() => setIsRegistering(false)} className="text-emerald-600 font-bold hover:underline">Sign In</button></p>
          ) : (
            <p>{isPublicMode ? 'Need to submit a grievance?' : 'Need to submit a grievance?'} <button onClick={() => setIsRegistering(true)} className="text-emerald-600 font-bold hover:underline">Register here</button></p>
          )}
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={onGoToPublic}
            className="w-full py-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Globe size={18} />
            Go to Public Portal
          </button>
        </div>
        
        {!isPublicMode && <p className="text-xs text-slate-400">Secure Internal Access Only</p>}
      </div>
    </div>
  );
};
