
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Key } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

const Header = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) return null; // Do not render if context is not available
  const { user, logout } = authContext;
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Recruitment Platform
            </h1>
            <p className="text-sm text-gray-600">
              Connected as: <span className="font-medium">{user?.firstname} {user?.lastname}</span> ({user?.role})
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Change password
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
};

export default Header;
