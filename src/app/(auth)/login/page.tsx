import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Inicia sesión en tu cuenta
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Regístrate
        </a>
      </p>
      <LoginForm />
    </div>
  );
}
