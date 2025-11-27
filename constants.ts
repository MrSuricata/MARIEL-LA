import { Product, Fair, HistoryEvent, BlogPost } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cartera "Río de la Plata"',
    description: 'Elegante cartera de cuero vacuno natural con terminaciones a mano. Ideal para uso diario o eventos casuales. Su diseño atemporal la convierte en un clásico instantáneo.',
    priceUYU: 4500,
    priceUSD: 115,
    category: 'Carteras',
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
    materials: ['Cuero vacuno 100%', 'Herrajes de bronce'],
    colors: ['Marrón Chocolate', 'Negro', 'Suela'],
    dimensions: '30cm x 25cm x 10cm',
    isFeatured: true
  },
  {
    id: '2',
    name: 'Billetera "Gaucho"',
    description: 'Billetera clásica de tres cuerpos con espacio para 12 tarjetas y monedero con cierre. Costura reforzada para máxima durabilidad.',
    priceUYU: 1800,
    priceUSD: 45,
    category: 'Billeteras',
    images: ['https://images.unsplash.com/photo-1627123424574-181ce90b94c0?w=800'],
    materials: ['Cuero engrasado'],
    colors: ['Marrón', 'Tostado'],
    dimensions: '11cm x 9cm',
    isFeatured: false
  },
  {
    id: '3',
    name: 'Mochila "Urbana"',
    description: 'Mochila compacta y segura, perfecta para la ciudad. Cuenta con bolsillo antirrobo en la espalda y correas ajustables.',
    priceUYU: 6200,
    priceUSD: 155,
    category: 'Mochilas',
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
    materials: ['Cuero napa suave', 'Forro de algodón'],
    colors: ['Negro', 'Bordo', 'Azul Marino'],
    dimensions: '35cm x 28cm x 12cm',
    isFeatured: true
  },
  {
    id: '4',
    name: 'Cinto "Tradición"',
    description: 'Cinturón de cuero crudo con hebilla artesanal. Un accesorio robusto que mejora con el tiempo.',
    priceUYU: 1500,
    priceUSD: 38,
    category: 'Cintos',
    images: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'],
    materials: ['Cuero vaqueta', 'Hebilla niquelada'],
    colors: ['Natural', 'Marrón Oscuro'],
    dimensions: 'Ancho 4cm, Largo a medida',
    isFeatured: false
  }
];

export const INITIAL_FAIRS: Fair[] = [
  {
    id: 'f1',
    name: 'Feria Ideas+',
    date: '2024-12-01',
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
    date: '2024-03-10',
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
    id: 'b1',
    title: "El Cuero en la Identidad Uruguaya",
    excerpt: "¿Sabías que Uruguay tiene una de las tradiciones de cuero más ricas del mundo? Descubre por qué nuestras piezas son únicas.",
    content: "Desde los tiempos de la colonia, la ganadería ha sido el motor de nuestro país, y con ella, el oficio del guasquero y el talabartero. El cuero uruguayo es reconocido mundialmente no solo por su calidad, sino por el tratamiento natural que se le da. A diferencia de las producciones industriales masivas, en Uruguay todavía valoramos el curtido vegetal, un proceso lento que utiliza taninos naturales de cortezas de árboles en lugar de cromo tóxico. Esto resulta en un cuero que respira, que huele a naturaleza y que desarrolla una pátina única con los años. Al comprar una pieza local, no solo llevás un objeto, llevás siglos de tradición gaucha.",
    author: "Mariela Calistro",
    date: "15 Oct 2024",
    readTime: "3 min lectura",
    imageUrl: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800"
  },
  {
    id: 'b2',
    title: "Curiosidades: Grano Pleno vs. Cuero Genuino",
    excerpt: "No todo el cuero es igual. Aprende a distinguir la calidad y por qué elegimos trabajar solo con lo mejor.",
    content: "En el mundo de la marroquinería existen muchos términos confusos. 'Genuine Leather' (Cuero Genuino) suena bien, ¿verdad? En realidad, es una de las calidades más bajas; se hace con las capas inferiores de la piel que sobran tras separar la parte buena. En MARIEL'LA utilizamos 'Full Grain' (Grano Pleno). Es la capa superior de la piel, la más resistente y la única que conserva la textura natural del animal, incluidas sus imperfecciones que lo hacen único. Es un cuero que nunca se pela, solo se embellece. Es más difícil de trabajar y requiere artesanos expertos, pero la diferencia se nota al tacto y en la durabilidad de décadas.",
    author: "Mariela Calistro",
    date: "28 Sep 2024",
    readTime: "4 min lectura",
    imageUrl: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=800"
  },
  {
    id: 'b3',
    title: "Guía Definitiva: Cómo Cuidar tu Cuero",
    excerpt: "Secretos del taller para que tu cartera o cinto dure para siempre y luzca mejor cada día.",
    content: "El cuero es piel, y como tal, necesita hidratación. 1. **Hidratación**: Una vez cada 6 meses, aplica una crema hidratante incolora o grasa de potro con un paño suave. 2. **Agua**: Si se moja, nunca lo seques al sol o con secador, eso lo acartona. Dejalo secar a la sombra naturalmente. 3. **Almacenamiento**: Guardá tus carteras rellenas de papel para que mantengan la forma y en bolsas de tela (nunca plástico) para que respiren. 4. **Manchas**: Si se mancha con aceite, cubrilo con talco inmediatamente y dejalo actuar 24 horas. Siguiendo estos pasos, tus piezas MARIEL'LA serán herencia para la próxima generación.",
    author: "Mariela Calistro",
    date: "10 Sep 2024",
    readTime: "2 min lectura",
    imageUrl: "https://images.unsplash.com/photo-1549497557-d54e624c9968?w=800"
  }
];

export const CATEGORIES = ['Todas', 'Carteras', 'Billeteras', 'Cintos', 'Mochilas', 'Accesorios'];