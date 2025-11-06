import React, { type JSX } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';


export default function LoginPage(): JSX.Element {
const [email, setEmail] = React.useState('');
const [password, setPassword] = React.useState('');
const [err, setErr] = React.useState<string | null>(null);


const login = async () => {
setErr(null);
try {
await signInWithEmailAndPassword(auth, email, password);
} catch (e: any) {
setErr(e.message || 'Ошибка входа');
}
};


return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md mx-5">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать</h3>
          <p className="text-gray-600 text-sm">Войдите в административную панель</p>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Электронная почта
            </label>
            <input 
              type="email"
              placeholder="Введите ваш email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input 
              type="password"
              placeholder="Введите ваш пароль" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
              required
            />
          </div>
          
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm text-center">{err}</div>
            </div>
          )}
          
          <button 
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
          >
            Войти
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Только для администраторов
          </p>
        </div>
      </div>
    </div>
  </div>
);
}