import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, KeyRound, AlertCircle, Loader2, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

export const Login = ({ 
  onLoginSuccess, 
  onGoToPublic, 
  t,
  initialRequirePasswordChange = false,
  initialTempUser = null,
  isPublicMode = false,
  initialIsRegistering = undefined,
  variant = 'public'
}: { 
  onLoginSuccess: (user: any) => void, 
  onGoToPublic: () => void, 
  t: any,
  initialRequirePasswordChange?: boolean,
  initialTempUser?: any,
  isPublicMode?: boolean,
  initialIsRegistering?: boolean,
  variant?: 'public' | 'admin'
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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${variant === 'admin' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-10 text-center space-y-8 relative overflow-hidden">
        {variant === 'admin' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        )}
        
        <div className="space-y-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border transition-colors ${variant === 'admin' ? 'bg-slate-900 text-emerald-500 border-slate-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {variant === 'admin' ? <Shield size={40} /> : <ShieldCheck size={40} />}
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              {variant === 'admin' ? 'Admin Gateway' : (isRegistering ? 'Identity Setup' : 'Member Access')}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed">
              {variant === 'admin' 
                ? 'Authorized personnel only. Secure administrative access required.' 
                : (isRegistering ? 'Initialize your citizen profile to access the ecosystem.' : 'Securely authenticate to your digital workspace.')}
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-3 text-left"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6 text-left">
          {isRegistering && (
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                  placeholder="+977..."
                />
              </div>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
              placeholder={isPublicMode ? "you@example.com" : "admin@system.org"}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
              placeholder="••••••••"
              minLength={isRegistering ? 6 : undefined}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 text-lg rounded-2xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-[0.98] ${variant === 'admin' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (isRegistering ? 'Initialize Profile' : 'Authenticate')}
          </button>
        </form>

        <div className="pt-4 flex items-center justify-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
          <Shield size={10} />
          <span>Secure Session</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>System Verified</span>
        </div>

        <div className="text-sm text-slate-500 pt-4">
          {isRegistering ? (
            <p className="font-medium">Already have an account? <button onClick={() => setIsRegistering(false)} className="text-emerald-600 font-black uppercase tracking-widest text-xs ml-1 hover:underline">Sign In</button></p>
          ) : (
            <p className="font-medium">{variant === 'admin' ? 'Administrative access only.' : 'New to the movement?'} <button onClick={() => setIsRegistering(true)} className="text-emerald-600 font-black uppercase tracking-widest text-xs ml-1 hover:underline">{variant === 'admin' ? 'Contact IT' : 'Register here'}</button></p>
          )}
        </div>
        
        <div className="pt-6 border-t border-slate-100">
          <button 
            type="button"
            onClick={onGoToPublic}
            className="w-full py-4 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Globe size={16} />
            Return to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
};
