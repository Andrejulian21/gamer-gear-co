import { Keyboard, Mouse, Headphones, Gamepad2, Package, type LucideIcon } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  teclados: Keyboard,
  mouse: Mouse,
  auriculares: Headphones,
  mousepads: Package,
  default: Gamepad2,
};
