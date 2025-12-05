
import React, { useState } from 'react';
import { useStore } from '../store';
import { User, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Sun, Moon, ArrowUp, Database } from 'lucide-react';
import { dbAPI } from '../db';
import OrigenLogo from '../components/OrigenLogo';

const Login: React.FC = () => {
  const { login, authError, theme, toggleTheme, settings, dbConnectionError } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localMsg, setLocalMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Password Visibility States
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Caps Lock State
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Animation State
  const [isSuccess, setIsSuccess] = useState(false); // Login Success
  const [welcomeName, setWelcomeName] = useState(''); // Para mostrar el nombre en la bienvenida

  // Login State
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Detect Caps Lock safely
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    // Check if getModifierState exists on the event object before calling it
    const event = e as any;
    if (event.getModifierState && typeof event.getModifierState === 'function') {
        const isActive = event.getModifierState('CapsLock');
        setCapsLockActive(isActive);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalMsg(null);

    try {
        // Obtenemos el usuario directamente para tener el nombre antes de loguear en el store
        const foundUser = await dbAPI.getUser(loginData.username);

        if (foundUser && foundUser.password === loginData.password) {
            setWelcomeName(foundUser.fullName); // Guardamos el nombre para la animación
            setIsSuccess(true);
            
            // Retrasar el login real para mostrar la animación
            setTimeout(async () => {
                 await login(loginData.username, loginData.password);
                 // No need to setIsLoading(false) as component unmounts/redirects
            }, 2000); 
        } else {
            // Flujo normal de error
            await login(loginData.username, loginData.password);
            setIsLoading(false);
            setLoginData({ username: '', password: '' });
        }
    } catch (e) {
        setIsLoading(false);
        setLocalMsg({ type: 'error', text: 'Error al intentar iniciar sesión' });
    }
  };

  if (isSuccess) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Bienvenido/a!</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{welcomeName}</p>
                  <p className="text-sm text-gray-400 mt-4">Ingresando al sistema...</p>
              </div>
          </div>
      );
  }

  // --- ERROR DE BASE DE DATOS CRÍTICO ---
  if (dbConnectionError) {
      return (
          <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 max-w-lg w-full p-8 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/50">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                          <Database className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Base de Datos No Inicializada</h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                          La conexión a Supabase es correcta, pero <strong>las tablas necesarias no existen</strong>.
                      </p>
                      
                      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 w-full mb-6 border border-slate-200 dark:border-slate-700">
                          <p className="font-bold mb-2">Instrucciones para solucionar:</p>
                          <ol className="list-decimal list-inside space-y-2">
                              <li>Ve al Dashboard de tu proyecto en Supabase.</li>
                              <li>Abre el <strong>SQL Editor</strong>.</li>
                              <li>Copia el contenido del archivo <code>sql/supabase_setup.sql</code> que está en tu código.</li>
                              <li>Pégalo en el editor y haz clic en <strong>RUN</strong>.</li>
                              <li>Recarga esta página.</li>
                          </ol>
                      </div>

                      <button 
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
                      >
                          Ya ejecuté el script, recargar página
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative z-10 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 text-center border-b border-slate-100 dark:border-slate-700 relative">
            <button 
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-yellow-500 transition-colors"
                title="Cambiar tema"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="inline-flex justify-center mb-4">
                {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                ) : (
                    <OrigenLogo className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
                )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{settings.appName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">{settings.appSubtitle}</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
            <form onSubmit={handleLoginSubmit} className="space-y-5">
                {(authError || localMsg) && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${localMsg?.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{authError || localMsg?.text}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Usuario</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            required
                            value={loginData.username}
                            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                            placeholder="Ingrese su usuario"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Contraseña</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type={showLoginPass ? "text" : "password"}
                            required
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            onKeyDown={checkCapsLock}
                            onKeyUp={checkCapsLock}
                            onFocus={checkCapsLock} 
                            className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowLoginPass(!showLoginPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            tabIndex={-1}
                        >
                            {showLoginPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {/* Caps Lock Warning */}
                    {capsLockActive && (
                        <div className="flex items-center mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse transition-all">
                            <ArrowUp className="w-4 h-4 mr-1.5" />
                            Bloq Mayús está activado
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-wait transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Verificando...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            Iniciar Sesión <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                    )}
                </button>
            </form>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 text-center border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
                Sistema de Gestión Interna v1.0
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
