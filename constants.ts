import { Product, Fair, HistoryEvent, BlogPost } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bolso Tote Artesanal "Boho Chic"',
    description: 'Pieza única de estilo bohemio, confeccionada artesanalmente. Combina vibrante cuero azul y gris con dinámicos flecos amarillos. Destaca su medallón central de cuero plateado con incrustación turquesa. Un accesorio audaz y con carácter.',
    priceUYU: 5800,
    priceUSD: 145,
    category: 'Carteras',
    images: ['https://drive.google.com/file/d/1anp427tiOl9TOxnBmLpendcxQqixPJ5B/view?usp=drive_link'],
    materials: ['Cuero azul y gris', 'Flecos de cuero amarillo', 'Incrustación turquesa'],
    colors: ['Azul', 'Gris', 'Amarillo'],
    dimensions: '35cm x 30cm x 12cm',
    isFeatured: true
  },
  {
    id: '2',
    name: 'Bolso Tote de Cuero "Serpiente Rosa"',
    description: 'Exclusivo bolso tote elaborado a mano. Impresiona por su cuero de alta calidad con textura estilo piel de serpiente en un intenso color rosa fucsia. Diseño moderno complementado con elegantes herrajes metálicos circulares.',
    priceUYU: 6500,
    priceUSD: 160,
    category: 'Carteras',
    images: ['https://drive.google.com/file/d/14iwM_Ve8_i570wAU724w2x4W1GRViOVV/view?usp=drive_link'],
    materials: ['Cuero texturizado serpiente', 'Herrajes metálicos'],
    colors: ['Rosa Fucsia'],
    dimensions: '32cm x 28cm x 10cm',
    isFeatured: true
  },
  {
    id: '3',
    name: 'Bolso Duffel de Cuero Marrón',
    description: 'Espacioso bolso de viaje tipo duffel, confeccionado expertamente en cuero marrón robusto y duradero. Cuenta con asas de mano reforzadas y correa de hombro ajustable con resistentes herrajes de metal envejecido. Estilo rústico y atemporal para tus escapadas.',
    priceUYU: 8900,
    priceUSD: 220,
    category: 'Accesorios',
    images: ['https://drive.google.com/file/d/1kEYWlpPGrf-mUAK605m00SCbR5kapSLm/view?usp=drive_link'],
    materials: ['Cuero marrón robusto', 'Metal envejecido'],
    colors: ['Marrón'],
    dimensions: '50cm x 30cm x 25cm',
    isFeatured: true
  }
];

export const INITIAL_FAIRS: Fair[] = [
  {
    id: 'f1',
    name: 'Feria Ideas+',
    date: '2025-12-01',
    city: 'Montevideo',
    location: 'Parque Rodó',
    description: 'Estaremos presentes en el stand 45 con toda la nueva colección de verano.',
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800',
    mapsUrl: 'https://goo.gl/maps/xyz'
  },
  {
    id: 'f2',
    name: 'Fiesta de la Patria Gaucha',
    date: '2025-03-10',
    city: 'Tacuarembó',
    location: 'Laguna de las Lavanderas',
    description: 'Un éxito total, gracias a todos los que pasaron a saludar.',
    status: 'past',
    imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800'
  }
];

export const INITIAL_HISTORY: HistoryEvent[] = [
  {
    id: 'h1',
    year: "1998",
    title: "El Comienzo",
    description: "Todo comenzó en un pequeño taller familiar en el interior de Uruguay. Lo que empezó como un hobby, reparando monturas y aperos viejos, despertó una curiosidad profunda por la nobleza del cuero.",
    imageUrl: "https://images.unsplash.com/photo-1605218427368-35b158650a64?w=800"
  },
  {
    id: 'h2',
    year: "2010",
    title: "El Oficio",
    description: "Aprendimos que el cuero tiene memoria, que cada pieza respira. Nos especializamos en la talabartería tradicional, respetando los tiempos que exige el material.",
    imageUrl: "https://images.unsplash.com/photo-1598532163257-52648740d12e?w=800"
  },
  {
    id: 'h3',
    year: "2024",
    title: "MARIEL'LA Hoy",
    description: "Hoy, MARIEL'LA es sinónimo de calidad artesanal. No somos una fábrica; somos un taller donde cada cliente se lleva una parte de nuestra historia.",
    imageUrl: "https://images.unsplash.com/photo-1473188588951-e5d7eda7b6ac?w=800"
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'b4',
    title: "MARIEL'LA en AM 770 Oriental",
    excerpt: "Estuvimos conversando sobre la pasión por la artesanía y nuestras nuevas creaciones en la radio.",
    content: "Queremos expresar nuestro profundo agradecimiento a AM 770 Oriental por abrirnos las puertas de su estudio. Fue un placer inmenso poder compartir con la audiencia nuestra pasión por el cuero, el proceso creativo detrás de cada pieza única y las historias que dan vida a MARIEL'LA. Gracias por apoyar la artesanía uruguaya y permitirnos difundir nuestro arte. ¡Seguimos creando con más inspiración que nunca!",
    author: "Mariela Calistro",
    date: "20 Mar 2025",
    readTime: "Escuchar nota",
    imageUrl: "https://drive.google.com/file/d/1p0rhmnjphBl7F9ZVFLl-PagsD1YYysTt/view?usp=drive_link"
  },
  {
    id: 'b1',
    title: "El Cuero en la Identidad Uruguaya",
    excerpt: "¿Sabías que Uruguay tiene una de las tradiciones de cuero más ricas del mundo? Descubre por qué nuestras piezas son únicas.",
    content: "Desde los tiempos de la colonia, la ganadería ha sido el motor de nuestro país, y con ella, el oficio del guasquero y el talabartero. El cuero uruguayo es reconocido mundialmente no solo por su calidad, sino por el tratamiento natural que se le da. A diferencia de las producciones industriales masivas, en Uruguay todavía valoramos el curtido vegetal, un proceso lento que utiliza taninos naturales de cortezas de árboles en lugar de cromo tóxico. Esto resulta en un cuero que respira, que huele a naturaleza y que desarrolla una pátina única con los años. Al comprar una pieza local, no solo llevás un objeto, llevás siglos de tradición gaucha.",
    author: "Mariela Calistro",
    date: "15 Ene 2025",
    readTime: "3 min lectura",
    imageUrl: "https://drive.google.com/file/d/1qeN28si1WAj_TmotiGxcENBATPK1Ugze/view?usp=drive_link"
  },
  {
    id: 'b2',
    title: "Curiosidades: Grano Pleno vs. Cuero Genuino",
    excerpt: "No todo el cuero es igual. Aprende a distinguir la calidad y por qué elegimos trabajar solo con lo mejor.",
    content: "En el mundo de la marroquinería existen muchos términos confusos. 'Genuine Leather' (Cuero Genuino) suena bien, ¿verdad? En realidad, es una de las calidades más bajas; se hace con las capas inferiores de la piel que sobran tras separar la parte buena. En MARIEL'LA utilizamos 'Full Grain' (Grano Pleno). Es la capa superior de la piel, la más resistente y la única que conserva la textura natural del animal, incluidas sus imperfecciones que lo hacen único. Es un cuero que nunca se pela, solo se embellece. Es más difícil de trabajar y requiere artesanos expertos, pero la diferencia se nota al tacto y en la durabilidad de décadas.",
    author: "Mariela Calistro",
    date: "28 Feb 2025",
    readTime: "4 min lectura",
    imageUrl: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=800"
  },
  {
    id: 'b3',
    title: "Guía Definitiva: Cómo Cuidar tu Cuero",
    excerpt: "Secretos del taller para que tu cartera o cinto dure para siempre y luzca mejor cada día.",
    content: "El cuero es piel, y como tal, necesita hidratación. 1. **Hidratación**: Una vez cada 6 meses, aplica una crema hidratante incolora o grasa de potro con un paño suave. 2. **Agua**: Si se moja, nunca lo seques al sol o con secador, eso lo acartona. Dejalo secar a la sombra naturalmente. 3. **Almacenamiento**: Guardá tus carteras rellenas de papel para que mantengan la forma y en bolsas de tela (nunca plástico) para que respiren. 4. **Manchas**: Si se mancha con aceite, cubrilo con talco inmediatamente y dejalo actuar 24 horas. Siguiendo estos pasos, tus piezas MARIEL'LA serán herencia para la próxima generación.",
    author: "Mariela Calistro",
    date: "10 Mar 2025",
    readTime: "2 min lectura",
    imageUrl: "https://drive.google.com/file/d/1A8uunxmriIof4e23Zr1xO7HdmIVdHTuY/view?usp=drive_link"
  }
];

export const INITIAL_CATEGORIES = ['Todas', 'Carteras', 'Billeteras', 'Cintos', 'Mochilas', 'Accesorios'];