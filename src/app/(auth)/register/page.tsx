import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Crea tu cuenta
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Inicia sesión
        </a>
      </p>
      <RegisterForm />
    </div>
  );
}
