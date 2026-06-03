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

// Real product images from Unsplash (600x600 optimized, fit=crop)
const productImage = (id: string): string =>
  `https://images.unsplash.com/${id}?w=600&h=600&fit=crop&auto=format&q=80`;

// Mouse category
const MOUSE_DEATHADDER = 'photo-1615663245857-ac93bb7c39e7';
const MOUSE_BASILISK = 'photo-1605773527852-c546a8584ea3';
const MOUSE_SUPERLIGHT = 'photo-1629429408209-1f912961dbd8';
const MOUSE_G502 = 'photo-1696710257827-75e2e5954059';
const MOUSE_DARK_CORE = 'photo-1628832307345-7404b47f1751';

export const products: ProductSeed[] = [
  // ----- MOUSE (8) -----
  {
    name: 'Razer DeathAdder V3 Pro',
    slug: 'razer-deathadder-v3-pro',
    description:
      'Mouse inalambrico ergonomico con sensor optico Focus Pro 30K y switches opticos de tercera generacion. Disenado para esports con un peso de solo 63 gramos y autonomia de hasta 90 horas por carga.',
    price: '499000.00',
    stock: 25,
    images: [productImage(MOUSE_DEATHADDER)],
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
    images: [productImage(MOUSE_BASILISK)],
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
    images: [productImage(MOUSE_SUPERLIGHT)],
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
    images: [productImage(MOUSE_G502)],
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
    images: [productImage(MOUSE_DARK_CORE)],
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
    images: [productImage(MOUSE_DEATHADDER)],
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
    images: [productImage(MOUSE_BASILISK)],
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
    images: [productImage(MOUSE_SUPERLIGHT)],
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
    images: [productImage('photo-1538481199705-c710c4e965fc')],
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
    images: [productImage('photo-1635987391914-cb84b567e68f')],
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
    images: [productImage('photo-1632079003110-d694908500da')],
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
    images: [productImage('photo-1544652478-6653e09f18a2')],
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
    images: [productImage('photo-1612198188060-c7c2a3b66eae')],
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
    images: [productImage('photo-1696710257827-75e2e5954059')],
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
    images: [productImage('photo-1626958390943-a70309376444')],
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
    images: [productImage('photo-1547394765-185e1e68f34e')],
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
    images: [productImage('photo-1560419015-7c427e8ae5ba')],
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
    images: [productImage('photo-1610041321063-bbaf5286de89')],
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
    images: [productImage('photo-1610041321327-b794c052db27')],
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
    images: [productImage('photo-1610041321420-a596dd14ebc9')],
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
    images: [productImage('photo-1629429407756-4a7703614972')],
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
    images: [productImage('photo-1677086813101-496781a0f327')],
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
    images: [productImage('photo-1628501899963-43bb8e2423e1')],
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
    images: [productImage('photo-1566055972289-c52022ae23b7')],
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
    images: [productImage('photo-1585620385456-4759f9b5c7d9')],
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
    images: [productImage('photo-1636036769389-343bb250f013')],
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
    images: [productImage('photo-1587749091716-f7b291a87f87')],
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
    images: [productImage('photo-1616071358409-ef30a44a90bb')],
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
    images: [productImage('photo-1636036758527-266adfee3fcf')],
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
    images: [productImage('photo-1589401806207-2381455bce76')],
    featured: false,
    brandSlug: 'razer',
    categorySlug: 'mousepads',
  },
];
