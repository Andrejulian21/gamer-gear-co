/**
 * Catalog seed data: brands, categories, products.
 *
 * Kept separate from seed.ts so the entry point stays focused on
 * orchestration. All data is static and deterministic so the seed
 * is reproducible and idempotent.
 */

export type BrandSeed = {
  name: string;
  slug: string;
  logo: string;
};

export type CategorySeed = {
  name: string;
  slug: string;
};

export type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  images: string[];
  featured: boolean;
  brandSlug: string;
  categorySlug: string;
};

export const brands: BrandSeed[] = [
  {
    name: 'Razer',
    slug: 'razer',
    logo: 'https://placehold.co/200x200/000000/00FF00?text=RAZER',
  },
  {
    name: 'Logitech G',
    slug: 'logitech-g',
    logo: 'https://placehold.co/200x200/0046AD/FFFFFF?text=LOGITECH+G',
  },
  {
    name: 'Corsair',
    slug: 'corsair',
    logo: 'https://placehold.co/200x200/FCC419/000000?text=CORSAIR',
  },
  {
    name: 'HyperX',
    slug: 'hyperx',
    logo: 'https://placehold.co/200x200/D32F2F/FFFFFF?text=HYPERX',
  },
  {
    name: 'Redragon',
    slug: 'redragon',
    logo: 'https://placehold.co/200x200/FF6B00/FFFFFF?text=REDRAGON',
  },
];

export const categories: CategorySeed[] = [
  { name: 'Mouse', slug: 'mouse' },
  { name: 'Teclados', slug: 'teclados' },
  { name: 'Auriculares', slug: 'auriculares' },
  { name: 'Mousepads', slug: 'mousepads' },
];

const placeholderImage = (name: string): string =>
  `https://placehold.co/600x600/0a0a0a/FFFFFF?text=${encodeURIComponent(name)}`;

export const products: ProductSeed[] = [
  // ----- MOUSE (8) -----
  {
    name: 'Razer DeathAdder V3 Pro',
    slug: 'razer-deathadder-v3-pro',
    description:
      'Mouse inalambrico ergonomico con sensor optico Focus Pro 30K y switches opticos de tercera generacion. Disenado para esports con un peso de solo 63 gramos y autonomia de hasta 90 horas por carga.',
    price: '499000.00',
    stock: 25,
    images: [placeholderImage('Razer DeathAdder V3 Pro')],
    featured: true,
    brandSlug: 'razer',
    categorySlug: 'mouse',
  },
  {
    name: 'Razer Basilisk V3',
    slug: 'razer-basilisk-v3',
    description:
      'Mouse alambrico con 11 botones programables y rueda de desplazamiento libre HyperScroll. Sensor optico 26K DPI e iluminacion Chroma RGB con 11 zonas para una personalizacion total.',
    price: '329000.00',
    stock: 18,
    images: [placeholderImage('Razer Basilisk V3')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'mouse',
  },
  {
    name: 'Logitech G Pro X Superlight',
    slug: 'logitech-g-pro-x-superlight',
    description:
      'Mouse inalambrico para esports con un peso inferior a 63 gramos y sensor HERO 25K. Sin perforaciones en la carcasa, ofrece una autonomia de hasta 70 horas y conexion LIGHTSPEED de latencia submilimetrica.',
    price: '549000.00',
    stock: 12,
    images: [placeholderImage('Logitech G Pro X Superlight')],
    featured: true,
    brandSlug: 'logitech-g',
    categorySlug: 'mouse',
  },
  {
    name: 'Logitech G502 Hero',
    slug: 'logitech-g502-hero',
    description:
      'Mouse alambrico con sensor HERO 25K, 11 botones programables y sistema de pesos ajustable. Diseno ergonmico probado y memoria integrada para guardar perfiles directamente en el dispositivo.',
    price: '219000.00',
    stock: 30,
    images: [placeholderImage('Logitech G502 Hero')],
    featured: false,
    brandSlug: 'logitech-g',
    categorySlug: 'mouse',
  },
  {
    name: 'Corsair Dark Core RGB Pro',
    slug: 'corsair-dark-core-rgb-pro',
    description:
      'Mouse inalambrico para juegos con sensor optico de 18.000 DPI y tecnologia Slipstream Wireless de latencia inferior a 1 ms. Tres modos de conexion: Slipstream, Bluetooth y USB cableado.',
    price: '399000.00',
    stock: 15,
    images: [placeholderImage('Corsair Dark Core RGB Pro')],
    featured: false,
    brandSlug: 'corsair',
    categorySlug: 'mouse',
  },
  {
    name: 'HyperX Pulsefire Haste',
    slug: 'hyperx-pulsefire-haste',
    description:
      'Mouse ultraligero con carcasa tipo panal de solo 59 gramos y sensor Pixart PMW3335. Cable HyperFlex trenzado y switches TTC Golden Micro resistentes al polvo con 60 millones de clics de durabilidad.',
    price: '219000.00',
    stock: 22,
    images: [placeholderImage('HyperX Pulsefire Haste')],
    featured: false,
    brandSlug: 'hyperx',
    categorySlug: 'mouse',
  },
  {
    name: 'Redragon Cobra Pro',
    slug: 'redragon-cobra-pro',
    description:
      'Mouse inalambrico con sensor optico Pixart 3338 de 16.000 DPI y tres modos de conexion: 2.4G, Bluetooth 5.0 y USB-C. Bateria recargable de hasta 45 horas y pies de PTFE puro para deslizamiento suave.',
    price: '189000.00',
    stock: 28,
    images: [placeholderImage('Redragon Cobra Pro')],
    featured: false,
    brandSlug: 'redragon',
    categorySlug: 'mouse',
  },
  {
    name: 'Redragon Griffin',
    slug: 'redragon-griffin',
    description:
      'Mouse alambrico con sensor optico de 7200 DPI, 7 botones programables e iluminacion RGB configurable. Ergonomia ambidiestra con agarres laterales de goma para sesiones prolongadas sin fatiga.',
    price: '99000.00',
    stock: 40,
    images: [placeholderImage('Redragon Griffin')],
    featured: false,
    brandSlug: 'redragon',
    categorySlug: 'mouse',
  },

  // ----- TECLADOS (8) -----
  {
    name: 'Razer BlackWidow V4 Pro',
    slug: 'razer-blackwidow-v4-pro',
    description:
      'Teclado mecanico full-size con switches Razer Green tactiles y clicky, reposamuñecas magnetico e iluminacion Chroma RGB por tecla. Cuenta con 8 teclas macro dedicadas y rueda de control multimedia.',
    price: '1199000.00',
    stock: 8,
    images: [placeholderImage('Razer BlackWidow V4 Pro')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'teclados',
  },
  {
    name: 'Razer Huntsman Mini',
    slug: 'razer-huntsman-mini',
    description:
      'Teclado mecanico 60% con switches opticos Razer Linear de actuacion instantanea y distancia de actuacion de 1.5 mm. Carcasa de aluminio y cable USB-C desmontable para portabilidad.',
    price: '429000.00',
    stock: 14,
    images: [placeholderImage('Razer Huntsman Mini')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'teclados',
  },
  {
    name: 'Logitech G Pro X',
    slug: 'logitech-g-pro-x',
    description:
      'Teclado mecanico TKL disenado con y para atletas de esports, con switches GX intercambiables. Construccion sin teclado numerico con cable micro USB desmontable y teclas PBT de doble inyeccion.',
    price: '599000.00',
    stock: 10,
    images: [placeholderImage('Logitech G Pro X')],
    featured: true,
    brandSlug: 'logitech-g',
    categorySlug: 'teclados',
  },
  {
    name: 'Logitech G915 TKL',
    slug: 'logitech-g915-tkl',
    description:
      'Teclado mecanico inalambrico con switches GL de perfil bajo, construccion en aluminio y diseno sin teclado numerico. Tecnologia LIGHTSPEED para una conexion inalambrica de 1 ms y autonomia de 40 horas.',
    price: '1099000.00',
    stock: 7,
    images: [placeholderImage('Logitech G915 TKL')],
    featured: true,
    brandSlug: 'logitech-g',
    categorySlug: 'teclados',
  },
  {
    name: 'Corsair K70 RGB MK.2',
    slug: 'corsair-k70-rgb-mk2',
    description:
      'Teclado mecanico full-size con switches Cherry MX Red y estructura de aluminio anodizado cepillado. Cada tecla tiene iluminacion RGB individual y el reposamanos es de plastico suave al tacto.',
    price: '949000.00',
    stock: 9,
    images: [placeholderImage('Corsair K70 RGB MK.2')],
    featured: true,
    brandSlug: 'corsair',
    categorySlug: 'teclados',
  },
  {
    name: 'Corsair K65 RGB Mini',
    slug: 'corsair-k65-rgb-mini',
    description:
      'Teclado mecanico 60% con switches Cherry MX Red y perillas de control de brillo y velocidad. Cable USB-C desmontable y tecnologia de hiper-procesamiento de 8.000 Hz para latencia minima.',
    price: '499000.00',
    stock: 16,
    images: [placeholderImage('Corsair K65 RGB Mini')],
    featured: false,
    brandSlug: 'corsair',
    categorySlug: 'teclados',
  },
  {
    name: 'HyperX Alloy Origins',
    slug: 'hyperx-alloy-origins',
    description:
      'Teclado mecanico TKL con switches HyperX Red lineales, cuerpo de aluminio aeroespacial y cable USB-C a USB-A trenzado. Iluminacion RGB por tecla con efectos dinamicos y memoria interna para tres perfiles.',
    price: '399000.00',
    stock: 20,
    images: [placeholderImage('HyperX Alloy Origins')],
    featured: false,
    brandSlug: 'hyperx',
    categorySlug: 'teclados',
  },
  {
    name: 'Redragon Kumara K552',
    slug: 'redragon-kumara-k552',
    description:
      'Teclado mecanico TKL con switches Outemu Blue clicky y estructura de metal reforzada. Iluminacion Rainbow LED con multiples efectos y modo juego que desactiva la tecla Windows para evitar interrupciones.',
    price: '159000.00',
    stock: 35,
    images: [placeholderImage('Redragon Kumara K552')],
    featured: false,
    brandSlug: 'redragon',
    categorySlug: 'teclados',
  },

  // ----- AURICULARES (8) -----
  {
    name: 'Razer Kraken V3',
    slug: 'razer-kraken-v3',
    description:
      'Auriculares gaming USB con drivers de 50 mm TriForce Titanium, sonido espacial THX Spatial Audio y diadema con almohadillas de espuma viscoelastica. Microfono cardioide HyperClear retrctil con cancelacion de ruido.',
    price: '449000.00',
    stock: 17,
    images: [placeholderImage('Razer Kraken V3')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'auriculares',
  },
  {
    name: 'Razer BlackShark V2 Pro',
    slug: 'razer-blackshark-v2-pro',
    description:
      'Auriculares inalambricos con drivers TriForce Titanium de 50 mm, microfono HyperClear Superamortiguado y hasta 70 horas de autonomia. Certificacion Discord y compatibilidad multiplataforma con dongle USB-C.',
    price: '899000.00',
    stock: 11,
    images: [placeholderImage('Razer BlackShark V2 Pro')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'auriculares',
  },
  {
    name: 'Logitech G Pro X Wireless',
    slug: 'logitech-g-pro-x-wireless',
    description:
      'Auriculares inalambricos para esports con tecnologia LIGHTSPEED, drivers PRO-G de 50 mm y microfono Blue VO!CE con filtros de voz. Construccion en aluminio y acero con almohadillas de espuma viscoelastica.',
    price: '799000.00',
    stock: 13,
    images: [placeholderImage('Logitech G Pro X Wireless')],
    featured: false,
    brandSlug: 'logitech-g',
    categorySlug: 'auriculares',
  },
  {
    name: 'Logitech G733',
    slug: 'logitech-g733',
    description:
      'Auriculares inalambricos RGB con tecnologia LIGHTSPEED, drivers PRO-G de 40 mm y hasta 29 horas de autonomia. Diadema reversible con suspension ajustable e iluminacion frontal personalizable LIGHTSYNC RGB.',
    price: '499000.00',
    stock: 19,
    images: [placeholderImage('Logitech G733')],
    featured: false,
    brandSlug: 'logitech-g',
    categorySlug: 'auriculares',
  },
  {
    name: 'Corsair HS70 Pro',
    slug: 'corsair-hs70-pro',
    description:
      'Auriculares inalambricos con conexion Slipstream de 2.4 GHz y drivers de neodimio de 50 mm. Microfono omnidireccional desmontable y almohadillas de espuma viscoelastica con tela deportiva transpirable.',
    price: '399000.00',
    stock: 21,
    images: [placeholderImage('Corsair HS70 Pro')],
    featured: false,
    brandSlug: 'corsair',
    categorySlug: 'auriculares',
  },
  {
    name: 'Corsair Void RGB Elite',
    slug: 'corsair-void-rgb-elite',
    description:
      'Auriculares gaming con sonido envolvente 7.1, drivers de neodimio de 50 mm e iluminacion RGB en cada auricular. Microfono omnidireccional con mute al subirlo y diadema reforzada con construccion en aluminio.',
    price: '499000.00',
    stock: 16,
    images: [placeholderImage('Corsair Void RGB Elite')],
    featured: false,
    brandSlug: 'corsair',
    categorySlug: 'auriculares',
  },
  {
    name: 'HyperX Cloud II',
    slug: 'hyperx-cloud-ii',
    description:
      'Auriculares gaming con sonido envolvente 7.1 virtual, drivers de neodimio de 53 mm y estructura de aluminio. Microfono con cancelacion de ruido, almohadillas de espuma viscoelastica y caja de control USB incluida.',
    price: '349000.00',
    stock: 24,
    images: [placeholderImage('HyperX Cloud II')],
    featured: true,
    brandSlug: 'hyperx',
    categorySlug: 'auriculares',
  },
  {
    name: 'Redragon Zeus X',
    slug: 'redragon-zeus-x',
    description:
      'Auriculares gaming con sonido envolvente virtual 7.1, drivers de neodimio de 53 mm y microfono con cancelacion de ruido. Almohadillas de proteina suaves con memoria y diadema con suspension automatica.',
    price: '219000.00',
    stock: 26,
    images: [placeholderImage('Redragon Zeus X')],
    featured: false,
    brandSlug: 'redragon',
    categorySlug: 'auriculares',
  },

  // ----- MOUSEPADS (6) -----
  {
    name: 'Razer Goliathus Extended',
    slug: 'razer-goliathus-extended',
    description:
      'Mousepad extendido de 920x294 mm con superficie de tela microtexturizada optimizada para sensores opticos y laser. Base de goma antideslizante y bordes cosidos anti-desgaste para maxima durabilidad.',
    price: '149000.00',
    stock: 30,
    images: [placeholderImage('Razer Goliathus Extended')],
    featured: true,
    brandSlug: 'razer',
    categorySlug: 'mousepads',
  },
  {
    name: 'Logitech G440',
    slug: 'logitech-g440',
    description:
      'Mousepad rigido de baja friccion con superficie de polimero de alta densidad. Ideal para jugadores que prefieren un desplazamiento rapido y consistente, con base de goma estable sobre cualquier superficie.',
    price: '99000.00',
    stock: 27,
    images: [placeholderImage('Logitech G440')],
    featured: false,
    brandSlug: 'logitech-g',
    categorySlug: 'mousepads',
  },
  {
    name: 'Corsair MM350 Pro',
    slug: 'corsair-mm350-pro',
    description:
      'Mousepad extendido de 900x400 mm con superficie de tela de microfibra tejida de alta densidad. Base de goma antideslizante y costuras reforzadas con grosor de 5 mm para soporte de muneca confortable.',
    price: '119000.00',
    stock: 23,
    images: [placeholderImage('Corsair MM350 Pro')],
    featured: false,
    brandSlug: 'corsair',
    categorySlug: 'mousepads',
  },
  {
    name: 'HyperX Fury S Pro',
    slug: 'hyperx-fury-s-pro',
    description:
      'Mousepad grande de tela con superficie cosida anti-deshilachado y base de goma natural texturizada. Superficie uniforme optimizada para maxima precision de seguimiento con sensores opticos.',
    price: '99000.00',
    stock: 32,
    images: [placeholderImage('HyperX Fury S Pro')],
    featured: false,
    brandSlug: 'hyperx',
    categorySlug: 'mousepads',
  },
  {
    name: 'Redragon Kunlun L',
    slug: 'redragon-kunlun-l',
    description:
      'Mousepad XXL de 900x400 mm con superficie de tela impermeable y base de goma antideslizante. Bordes reforzados cosidos para evitar el despegado y un grosor de 4 mm para sesiones largas y comodos.',
    price: '89000.00',
    stock: 38,
    images: [placeholderImage('Redragon Kunlun L')],
    featured: false,
    brandSlug: 'redragon',
    categorySlug: 'mousepads',
  },
  {
    name: 'Razer Vespula V2',
    slug: 'razer-vespula-v2',
    description:
      'Mousepad doble cara con una superficie de control Speed y otra Control. Base de doble capa con zonas intercambiables para ajuste ergonomico y agarres laterales para un transporte mas comodo.',
    price: '89000.00',
    stock: 20,
    images: [placeholderImage('Razer Vespula V2')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'mousepads',
  },
];
