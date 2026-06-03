'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? 'Ingresando...' : 'Ingresar'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, {});

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.errors?._form && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.errors._form.join(', ')}
        </div>
      )}
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Email"
          />
          {state.errors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.errors.email.join(', ')}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Contraseña"
          />
          {state.errors?.password && (
            <p className="mt-1 text-sm text-red-600">{state.errors.password.join(', ')}</p>
          )}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
