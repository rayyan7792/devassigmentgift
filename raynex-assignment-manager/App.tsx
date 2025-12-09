import React, { useState, useEffect, Suspense } from 'react';
import { AuthState } from './types';
import { Loader2 } from 'lucide-react';

// Lazy load components for performance optimization
const Login = React.lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Editor = React.lazy(() => import('./components/Editor').then(module => ({ default: module.Editor })));

// Loading fallback component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-green-500">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

function App() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);

  // Restore session
  useEffect(() => {
    const savedUser = localStorage.getItem('raynex_user');
    if (savedUser) {
      setAuth({ isAuthenticated: true, user: JSON.parse(savedUser) });
    }
  }, []);

  const handleLogin = (user: { username: string }) => {
    localStorage.setItem('raynex_user', JSON.stringify(user));
    setAuth({ isAuthenticated: true, user });
  };

  const handleLogout = () => {
    localStorage.removeItem('raynex_user');
    setAuth({ isAuthenticated: false, user: null });
    setCurrentAssignmentId(null);
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      {!auth.isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : currentAssignmentId ? (
        <Editor 
          assignmentId={currentAssignmentId} 
          onBack={() => setCurrentAssignmentId(null)} 
        />
      ) : (
        <Dashboard 
          user={auth.user!} 
          onLogout={handleLogout} 
          onSelectAssignment={setCurrentAssignmentId} 
        />
      )}
    </Suspense>
  );
}

export default App;