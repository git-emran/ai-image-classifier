import { LogOut, Loader2, Upload, MessageSquareText, Users, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useCallback } from 'react';
import { auth } from 'firebase-admin';
import { signOut } from 'firebase/auth';

const App = () => {
  const { currentUser, isLoadingAuth } = useAuth();

  const handleLogout = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Logout failed:", e);
      }
    }
  }, []);

  // Helper for mobile styles
  const style = {
    body: { fontFamily: 'Inter, sans-serif', backgroundColor: '#f7f9fc' },
  };

  return (
    <div style={style.body} className="min-h-screen flex flex-col items-center p-4">

      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center py-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-indigo-600" />
          AI Analyst
        </h1>
        {currentUser && (
          <div className="space-x-2 flex items-center">
            <span className="text-sm font-medium text-gray-600 hidden md:inline truncate max-w-[150px]">Welcome, {currentUser.email || 'Guest'}</span>
            <button
              onClick={handleLogout}
              className="py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="w-full max-w-7xl flex-grow">
        {isLoadingAuth && <LoadingSpinner message="Authenticating and initializing..." />}

        {!isLoadingAuth && (
          currentUser ? <AppDashboard /> : <AuthView />
        )}
      </main>
    </div>
  );
}

export default App
