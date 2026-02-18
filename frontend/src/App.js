import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import UsersProvider from './context/UsersContext';
import Users from './components/Users';
import ChatDetail from './components/ChatDetail';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginSuccess from './components/LoginSuccess';
import UserProfile from './components/UserProfile';
import FriendRequests from './components/FriendRequests';
import ConnectionsView from './components/ConnectionsView';
import NotificationsPage from './components/NotificationsPage';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
// 1. Create a Mobile-Optimized Layout Shell
const AppShell = () => {
  return (
    // h-[100dvh] ensures the app fits exactly within mobile browser bars
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--bg-primary)] overflow-hidden">
      
      {/* Scrollable Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>

     
    </div>
  );
};

function App() {

  useEffect(() => {
    const setupNativeMobile = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Make the Status Bar (clock/battery) dark mode style
          await StatusBar.setStyle({ style: Style.Dark });
          // Optional: Give it a background color to match your app header
          await StatusBar.setBackgroundColor({ color: '#121b22' });

          // 2. Prevent the Keyboard from hiding the input field!
          await Keyboard.setResizeMode({ mode: 'body' });
        } catch (err) {
          console.log("Native plugins not available in web mode", err);
        }
      }
    };

    setupNativeMobile();
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login-success" element={<LoginSuccess />} />

        {/* PROTECTED APP ROUTES */}
        <Route 
          element={
            <ProtectedRoute>
              <UsersProvider>
                <AppShell />
              </UsersProvider>
            </ProtectedRoute>
          }
        >
          {/* These will render inside the <Outlet /> of AppShell */}
          <Route path="/" element={<Users />} />
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/requests" element={<FriendRequests />} />
          <Route path="/profile/:id/connections" element={<ConnectionsView />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;