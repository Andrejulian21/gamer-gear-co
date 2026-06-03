import { EmptyState } from '@/presentation/components/empty-state';
import type { Address } from '@/domain/entities/Address';

import { AddressCard } from './address-card';
import { AddAddressCard } from './add-address-card';

interface AddressListProps {
  addresses: Address[];
}

/**
 * Address list (server component).
 *
 * Renders the user's saved addresses plus a "Agregar nueva" card at
 * the top. Server-rendered — mutations happen via the form
 * submissions on each card. The list ordering is already handled
 * by the PrismaAddressRepository (default first, then createdAt
 * desc).
 */
export function AddressList({ addresses }: AddressListProps) {
  return (
    <div className="space-y-4">
      <AddAddressCard hideDefaultCheckbox={addresses.some((a) => a.isDefault)} />

      {addresses.length === 0 ? (
        <EmptyState
          title="Aún no tienes direcciones guardadas"
          description="Agrega una para usarla en tus próximas compras."
        />
      ) : (
        <ul role="list" className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id}>
              <AddressCard address={address} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
