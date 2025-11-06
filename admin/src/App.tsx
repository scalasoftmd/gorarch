import React from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

export default function App(): React.JSX.Element {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-5">Загрузка...</div>;
  if (!user) return <LoginPage />;

  return (
    <div className="p-5">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Панель администратора</h1>
        <div>
          <button 
            onClick={() => signOut(auth)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
          >
            Выйти
          </button>
        </div>
      </header>

      <AdminPage />
    </div>
  );
}
