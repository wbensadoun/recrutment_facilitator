import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ResetPasswordModal from './ResetPasswordModal';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const authContext = useContext(AuthContext);
  if (!authContext) return null; // Do not render if context is not available
  const { login } = authContext;
  const navigate = useNavigate();

  const handleError = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string, testPassword: string) => {
    // Only fill the fields without submitting the form
    setEmail(testEmail);
    setPassword(testPassword);
    
    // Focus on the login button to indicate to the user that they can click on it
    setTimeout(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        (submitButton as HTMLButtonElement).focus();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Access your recruitment platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.test@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold mb-3">Available test accounts:</p>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Admin Account</p>
                <p className="text-xs">Email: admin.test@alenia.io</p>
                <p className="text-xs">Password: admin123</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => handleQuickLogin('admin.test@alenia.io', 'admin123')}
                >
                  Quick Login
                </Button>
              </div>
              
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Recruiter Account</p>
                <p className="text-xs">Email: marie.dupont@example.com</p>
                <p className="text-xs">Password: temp123</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => handleQuickLogin('marie.dupont@example.com', 'temp123')}
                >
                  Quick Login
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ResetPasswordModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default LoginForm;
