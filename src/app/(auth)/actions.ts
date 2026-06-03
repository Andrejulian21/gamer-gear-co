'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type AuthState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  message?: string;
};

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: {
        email: ['Este email ya está registrado'],
      },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER',
    },
  });

  // Sign in the user after registration
  await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  redirect('/');
}

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const next = sanitizeNext(formData.get('next'));

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch {
    return {
      errors: {
        _form: ['Email o contraseña incorrectos'],
      },
    };
  }

  redirect(next);
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect('/');
}

/**
 * Validates a candidate post-login redirect target. Rejects anything
 * that isn't a same-origin absolute path so a malicious link can never
 * bounce the user off-site after authenticating.
 */
function sanitizeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  if (value.startsWith('/\\')) return '/';
  return value;
}
