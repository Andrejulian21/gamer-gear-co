'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/infrastructure/auth/auth';
import { getAccountDeps } from '@/presentation/lib/account-deps';
import { EmailAlreadyInUseError, InvalidCurrentPasswordError } from '@/domain/errors/AccountErrors';
import { AddressNotFoundError, AddressNotOwnedError } from '@/domain/errors/AddressErrors';

/**
 * Account server actions (Phase 6 / Profile + Addresses).
 *
 * Auth-gating convention: every action resolves the session first and
 * returns a friendly error state when unauthenticated. The page also
 * redirects to /login if the session is missing — this is the
 * defense-in-depth net.
 *
 * Action state shape (mirrors `AuthState` from
 * `src/app/(auth)/actions.ts:20-28`): per-field error messages plus
 * a top-level `_form` array for unclassified errors, plus `success`
 * and `message` flags for the client to render toasts.
 */

export type AccountActionState<T = Record<string, unknown>> = {
  errors?: { [field: string]: string[] | undefined; _form?: string[] };
  success?: boolean;
  message?: string;
} & T;

export type ProfileActionState = AccountActionState;
export type PasswordActionState = AccountActionState;
export type AddressActionState = AccountActionState<{ addressId?: string }>;

// ---------- Profile ----------

const PROFILE_SCHEMA = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
});

/**
 * Update the signed-in user's name and/or email. Requires both fields
 * in the form payload (we let the client RHF enforce "at least one
 * changed" via dirtyFields tracking, but the use case throws if both
 * are missing — we pre-validate here so the error is friendly).
 */
export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { _form: ['Inicia sesión para actualizar tu perfil'] } };
  }

  const parsed = PROFILE_SCHEMA.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { name, email } = parsed.data;

  const { updateProfile } = getAccountDeps();
  try {
    await updateProfile({ userId: session.user.id, name, email });
  } catch (err) {
    if (err instanceof EmailAlreadyInUseError) {
      return { errors: { email: ['Este email ya está registrado'] } };
    }
    const message = err instanceof Error ? err.message : 'No se pudo actualizar el perfil';
    return { errors: { _form: [message] } };
  }

  revalidatePath('/account');
  return { success: true, message: 'Perfil actualizado' };
}

// ---------- Password ----------

const PASSWORD_SCHEMA = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmNewPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  });

/**
 * Change the signed-in user's password. Validates the current
 * password via `InvalidCurrentPasswordError` mapping. After success
 * the JWT cookie is still valid (NextAuth strategy is `jwt` and the
 * hash is not embedded in the token), so no re-auth is needed.
 */
export async function changePasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { _form: ['Inicia sesión para cambiar tu contraseña'] } };
  }

  const parsed = PASSWORD_SCHEMA.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmNewPassword: formData.get('confirmNewPassword'),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  const { changePassword } = getAccountDeps();
  try {
    await changePassword({
      userId: session.user.id,
      currentPassword,
      newPassword,
    });
  } catch (err) {
    if (err instanceof InvalidCurrentPasswordError) {
      return { errors: { currentPassword: ['La contraseña actual es incorrecta'] } };
    }
    const message = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña';
    return { errors: { _form: [message] } };
  }

  return { success: true, message: 'Contraseña actualizada' };
}

// ---------- Addresses ----------

const ADDRESS_SCHEMA = z.object({
  street: z.string().min(1, 'Ingresa la dirección'),
  city: z.string().min(1, 'Ingresa la ciudad'),
  state: z.string().min(1, 'Ingresa el departamento'),
  zipCode: z.string().min(1, 'Ingresa el código postal'),
  phone: z.string().min(7, 'Ingresa un teléfono válido'),
  isDefault: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')])
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});

const UPDATE_ADDRESS_SCHEMA = ADDRESS_SCHEMA.extend({
  addressId: z.string().min(1, 'Falta el id de la dirección'),
});

function readAddressFormFields(formData: FormData) {
  return {
    street: formData.get('street'),
    city: formData.get('city'),
    state: formData.get('state'),
    zipCode: formData.get('zipCode'),
    phone: formData.get('phone'),
    isDefault: formData.get('isDefault') ?? '',
  };
}

function readUpdateFormFields(formData: FormData) {
  return {
    ...readAddressFormFields(formData),
    addressId: formData.get('addressId'),
  };
}

function mapAddressError(err: unknown): AddressActionState {
  if (err instanceof AddressNotFoundError) {
    return { errors: { _form: ['La dirección ya no existe'] } };
  }
  if (err instanceof AddressNotOwnedError) {
    return { errors: { _form: ['No tienes permisos sobre esta dirección'] } };
  }
  const message = err instanceof Error ? err.message : 'No se pudo guardar la dirección';
  return { errors: { _form: [message] } };
}

/**
 * Add a new address to the signed-in user. The `isDefault` checkbox
 * is honored, but the spec requires that we never stomp an existing
 * default — that's the caller's responsibility when wiring the
 * checkbox (the add form hides it when a default already exists).
 */
export async function addAddressAction(
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { _form: ['Inicia sesión para agregar una dirección'] } };
  }

  const parsed = ADDRESS_SCHEMA.safeParse(readAddressFormFields(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { addAddress } = getAccountDeps();
  try {
    const created = await addAddress({
      userId: session.user.id,
      street: parsed.data.street,
      city: parsed.data.city,
      state: parsed.data.state,
      zipCode: parsed.data.zipCode,
      phone: parsed.data.phone,
      isDefault: parsed.data.isDefault,
    });
    revalidatePath('/account/addresses');
    return { success: true, message: 'Dirección agregada', addressId: created.id };
  } catch (err) {
    return mapAddressError(err);
  }
}

/**
 * Update an existing address. The form passes the addressId in a
 * hidden field; the use case performs the ownership check.
 */
export async function updateAddressAction(
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { _form: ['Inicia sesión para editar una dirección'] } };
  }

  const parsed = UPDATE_ADDRESS_SCHEMA.safeParse(readUpdateFormFields(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { updateAddress } = getAccountDeps();
  try {
    await updateAddress({
      addressId: parsed.data.addressId,
      userId: session.user.id,
      data: {
        street: parsed.data.street,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        phone: parsed.data.phone,
        isDefault: parsed.data.isDefault,
      },
    });
    revalidatePath('/account/addresses');
    return { success: true, message: 'Dirección actualizada' };
  } catch (err) {
    return mapAddressError(err);
  }
}

/**
 * Delete an address. Plain FormData with a hidden `addressId` field;
 * the component binds a confirm() dialog in the client. The action
 * revalidates /account/addresses and returns — the client toasts
 * from the success case.
 */
export async function deleteAddressAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const addressId = formData.get('addressId');
  if (typeof addressId !== 'string' || !addressId) return;

  const { deleteAddress } = getAccountDeps();
  try {
    await deleteAddress({ addressId, userId: session.user.id });
  } catch {
    // Swallow — the client surfaces the success state; the address
    // is either gone or never existed, both safe to ignore.
  }
  revalidatePath('/account/addresses');
}

/**
 * Mark an address as the user's default. Same FormData shape as
 * delete: a single hidden `addressId` field.
 */
export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const addressId = formData.get('addressId');
  if (typeof addressId !== 'string' || !addressId) return;

  const { setDefaultAddress } = getAccountDeps();
  try {
    await setDefaultAddress({ addressId, userId: session.user.id });
  } catch {
    // Same rationale as delete.
  }
  revalidatePath('/account/addresses');
}
