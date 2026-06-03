export function ShopFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
            Gamer Gear Colombia
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Periféricos gaming con envío a todo Colombia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <span>PSE</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
          <span>Nequi</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
          <span>Bancolombia</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
          <span>Tarjetas</span>
        </div>
        <p className="text-xs text-zinc-600">
          {new Date().getFullYear()} Gamer Gear Colombia. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
