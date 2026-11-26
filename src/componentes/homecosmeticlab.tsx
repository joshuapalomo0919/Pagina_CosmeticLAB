import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCosmetic } from '../context/cosmeticlab';
import { listarMaquilladorasActivas } from '../data/repositorios/maquilladorarepo';
import type { Maquilladora } from '../types/modelos';
import ImagenProducto from './imagenproductocosmeticlab';
import '../estilos/portafolio.css';

const serviciosDestacados = [
  {
    nombre: 'Moda',
    descripcionEs: 'Color, tendencias y creatividad para expresar tu estilo.',
    descripcionEn: 'Color, trends and creativity to express your style.',
    ocasionEs: 'Editoriales, sesiones de foto y eventos de moda.',
    ocasionEn: 'Editorials, photo shoots and fashion events.',
    acabadoEs: 'Definido y creativo, con color y contraste equilibrados.',
    acabadoEn: 'Defined and creative, with balanced color and contrast.',
    incluyeEs: 'Preparación de piel, armonía de tonos, detalles de ojos y labios, y revisión final.',
    incluyeEn: 'Skin preparation, color harmony, eye and lip details, and a final review.',
    imagen: '/assets/Un%20look%20para%20cada%20momento/moda.jpg',
  },
  {
    nombre: 'Social',
    descripcionEs: 'Un look personalizado para celebrar momentos especiales.',
    descripcionEn: 'A personalized look for your special occasions.',
    ocasionEs: 'Celebraciones, grados, reuniones y eventos especiales.',
    ocasionEn: 'Celebrations, graduations, gatherings and special events.',
    acabadoEs: 'Luminoso y equilibrado, adaptado a tu estilo y ocasión.',
    acabadoEn: 'Luminous and balanced, tailored to your style and occasion.',
    incluyeEs: 'Preparación de piel, base y color, definición de ojos y labios, y retoques de acabado.',
    incluyeEn: 'Skin preparation, complexion and color, eye and lip definition, and finishing touches.',
    imagen: '/assets/Un%20look%20para%20cada%20momento/social.jpg',
  },
  {
    nombre: 'Novia',
    descripcionEs: 'Un acabado armonioso y atemporal para tu gran día.',
    descripcionEn: 'A harmonious, timeless look for your wedding day.',
    ocasionEs: 'Ceremonias, bodas civiles y celebraciones previas a la boda.',
    ocasionEn: 'Ceremonies, civil weddings and pre-wedding celebrations.',
    acabadoEs: 'Elegante y fotogénico, con detalles delicados y bien definidos.',
    acabadoEn: 'Elegant and camera-ready, with delicate, well-defined details.',
    incluyeEs: 'Preparación de piel, diseño personalizado, equilibrio de ojos y labios, y revisión final juntas.',
    incluyeEn: 'Skin preparation, a personalized design, balanced eyes and lips, and a final review together.',
    imagen: '/assets/Un%20look%20para%20cada%20momento/novia.jpg',
  },
];

const imagenesProposito = [
  {
    src: '/assets/carrusel/carusel%201%20(1).jpg',
    altEs: 'Brochas de maquillaje con polvo iluminador',
    altEn: 'Makeup brushes with loose powder',
  },
  {
    src: '/assets/carrusel/carusel%201%20(2).jpg',
    altEs: 'Aplicación de maquillaje con una brocha',
    altEn: 'Makeup being applied with a brush',
  },
  {
    src: '/assets/carrusel/carusel%201%20(3).jpg',
    altEs: 'Detalle de maquillaje en los ojos',
    altEn: 'Close-up of eye makeup',
  },
  {
    src: '/assets/carrusel/carusel%201%20(4).jpg',
    altEs: 'Paleta de maquillaje y brochas',
    altEn: 'Makeup palette and brushes',
  },
];

const estilosPortafolio = [
  {
    nombre: 'Natural Beauty',
    descripcionEs: 'Piel fresca y detalles sutiles que realzan tus rasgos.',
    descripcionEn: 'Fresh skin and subtle details that enhance your features.',
  },
  {
    nombre: 'Fresh Glow',
    descripcionEs: 'Luminosidad suave con una apariencia saludable.',
    descripcionEn: 'Soft luminosity for a healthy-looking finish.',
  },
  {
    nombre: 'Romántico',
    descripcionEs: 'Tonos suaves y cálidos para un look delicado.',
    descripcionEn: 'Soft, warm tones for a delicate look.',
  },
  {
    nombre: 'Glam',
    descripcionEs: 'Más intensidad y definición para ocasiones especiales.',
    descripcionEn: 'More intensity and definition for special occasions.',
  },
  {
    nombre: 'Noche',
    descripcionEs: 'Un acabado duradero con una mirada más marcada.',
    descripcionEn: 'A lasting finish with a more defined eye.',
  },
  {
    nombre: 'Piel madura',
    descripcionEs: 'Frescura y luminosidad que respetan la textura natural.',
    descripcionEn: 'Freshness and luminosity that respect natural skin texture.',
  },
  {
    nombre: 'Novias',
    descripcionEs: 'Un maquillaje personal y atemporal para tu celebración.',
    descripcionEn: 'Personal, timeless makeup for your celebration.',
  },
  {
    nombre: 'Editorial',
    descripcionEs: 'Color y formas creativas para explorar nuevas ideas.',
    descripcionEn: 'Creative colors and shapes to explore new ideas.',
  },
];

const pasos = [
  { tituloEs: 'Preparar', tituloEn: 'Prepare', detalleEs: 'Preparamos la piel para recibir el look.', detalleEn: 'We prepare the skin for the look.', imagen: '/assets/Cada%20detalle%20tiene%20su%20momento/preparar.jpg' },
  { tituloEs: 'Crear', tituloEn: 'Create', detalleEs: 'Elegimos color, textura y técnica.', detalleEn: 'We choose color, texture and technique.', imagen: '/assets/Cada%20detalle%20tiene%20su%20momento/crear.jpg' },
  { tituloEs: 'Definir', tituloEn: 'Refine', detalleEs: 'Equilibramos los detalles del maquillaje.', detalleEn: 'We balance the details of the makeup.', imagen: '/assets/Cada%20detalle%20tiene%20su%20momento/definir.jpg' },
  { tituloEs: 'Resultado', tituloEn: 'The result', detalleEs: 'Revisamos juntas el look final.', detalleEn: 'Together, we review the final look.', imagen: '/assets/Cada%20detalle%20tiene%20su%20momento/resultado.jpg' },
];

const HomeCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [maquilladoras, setMaquilladoras] = useState<Maquilladora[]>([]);
  const [estiloAmpliado, setEstiloAmpliado] = useState<(typeof serviciosDestacados)[number] | null>(null);
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void listarMaquilladorasActivas()
      .then((lista) => {
        if (active) setMaquilladoras(lista);
      })
      .catch((loadError: unknown) => {
        console.error('No se pudo cargar el perfil de maquillaje.', loadError);
        if (active) {
          setError(english
            ? 'The makeup artist profile could not be loaded.'
            : 'No se pudo cargar el perfil de la maquilladora.');
        }
      });
    return () => {
      active = false;
    };
  }, [english]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const intervalo = window.setInterval(() => {
      setIndiceCarrusel((actual) => (actual + 1) % imagenesProposito.length);
    }, 5000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!estiloAmpliado) return undefined;

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEstiloAmpliado(null);
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, [estiloAmpliado]);

  const artistaPrincipal = maquilladoras[0];
  const imagenProposito = imagenesProposito[indiceCarrusel];
  const desplazarA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const cambiarImagenCarrusel = (desplazamiento: number) => {
    setIndiceCarrusel((actual) => (
      (actual + desplazamiento + imagenesProposito.length) % imagenesProposito.length
    ));
  };

  return (
    <main className="portfolio-page">
      <section className="portfolio-hero" id="inicio">
        <div className="portfolio-hero-copy">
          <span className="section-kicker">THE MAKEUP EDIT · BOGOTÁ</span>
          <h1>
            {english
              ? <>Makeup that brings<br /><em>out your essence.</em></>
              : <>Maquillaje para<br /><em>realzar tu esencia.</em></>}
          </h1>
          <p>
            {english
              ? 'Personalized makeup with care, creativity and attention to every detail. Home appointments available in Bogotá.'
              : 'Maquillaje personalizado con cuidado, creatividad y atención a cada detalle. Atención a domicilio en Bogotá.'}
          </p>
          <div className="portfolio-actions">
            <Link to="/citas" className="btn-primary">
              {english ? 'Book an appointment' : 'Agenda tu cita'} <span>→</span>
            </Link>
            <a href="#estilos" className="btn-secondary">
              {english ? 'Explore the portfolio' : 'Explora el portafolio'}
            </a>
          </div>
          <span className="portfolio-artist-name">
            {artistaPrincipal?.nombre ?? (english ? 'Professional makeup' : 'Maquillaje profesional')}
          </span>
        </div>
        <figure className="portfolio-hero-photo">
          <ImagenProducto
            key={artistaPrincipal?.imagen ?? ''}
            src={artistaPrincipal?.imagen ?? ''}
            alt={artistaPrincipal?.nombre ?? (english ? 'Makeup artist portrait' : 'Retrato de maquilladora')}
          />
          {artistaPrincipal && <figcaption>{artistaPrincipal.nombre}</figcaption>}
        </figure>
      </section>

      <section className="portfolio-purpose" id="nosotros">
        <span className="section-kicker">02 — {english ? 'Our purpose' : 'Nuestro propósito'}</span>
        <div className="portfolio-purpose-grid">
          <h2>
            {english
              ? <>Beauty is also<br /><em>a moment of care.</em></>
              : <>La belleza también es<br /><em>un momento de cuidado.</em></>}
          </h2>
          <figure
            className="portfolio-purpose-photo"
            role="region"
            aria-roledescription={english ? 'carousel' : 'carrusel'}
            aria-label={english ? 'CosmeticLAB purpose gallery' : 'Galería del propósito de CosmeticLAB'}
          >
            <ImagenProducto
              key={imagenProposito.src}
              src={imagenProposito.src}
              alt={english ? imagenProposito.altEn : imagenProposito.altEs}
            />
            <button
              className="portfolio-carousel-arrow portfolio-carousel-previous"
              type="button"
              aria-label={english ? 'Previous image' : 'Imagen anterior'}
              onClick={() => cambiarImagenCarrusel(-1)}
            >‹</button>
            <button
              className="portfolio-carousel-arrow portfolio-carousel-next"
              type="button"
              aria-label={english ? 'Next image' : 'Imagen siguiente'}
              onClick={() => cambiarImagenCarrusel(1)}
            >›</button>
            <div className="portfolio-carousel-indicators">
              {imagenesProposito.map((imagen, index) => (
                <button
                  key={imagen.src}
                  className={index === indiceCarrusel ? 'active' : ''}
                  type="button"
                  aria-label={english ? `Show image ${index + 1}` : `Mostrar imagen ${index + 1}`}
                  aria-current={index === indiceCarrusel ? 'true' : undefined}
                  onClick={() => setIndiceCarrusel(index)}
                />
              ))}
            </div>
            <span className="portfolio-carousel-count" aria-hidden="true">
              {`0${indiceCarrusel + 1} / 0${imagenesProposito.length}`}
            </span>
          </figure>
          <div className="portfolio-purpose-copy">
            <p>
              {english
                ? 'CosmeticLAB is a beauty company created to make makeup and skincare a more mindful, personal and joyful experience. We choose formulas that respect your skin and products that fit naturally into your routine.'
                : 'CosmeticLAB es una empresa de belleza creada para hacer del maquillaje y el cuidado de la piel una experiencia más consciente, cercana y alegre. Elegimos fórmulas que respetan tu piel y productos que se integran naturalmente a tu rutina.'}
            </p>
            <Link to="/productos" className="text-link">
              {english ? 'Explore our products' : 'Conoce nuestros productos'} →
            </Link>
          </div>
        </div>
        <button
          className="portfolio-scroll-next"
          type="button"
          onClick={() => desplazarA('estilos-destacados')}
        >
          {english ? 'Keep scrolling' : 'Seguir bajando'} <span aria-hidden="true">↓</span>
        </button>
      </section>

      {error && <p className="error-message portfolio-error" role="alert">{error}</p>}

      <section className="portfolio-services" id="estilos-destacados">
        <div className="portfolio-section-heading">
          <span className="section-kicker">{english ? 'Featured styles' : 'Estilos destacados'}</span>
          <h2>{english ? 'Makeup for your moment.' : 'Un look para cada momento.'}</h2>
        </div>
        <div className="portfolio-service-grid">
          {serviciosDestacados.map((servicio, index) => (
            <article className="portfolio-service-card" key={servicio.nombre}>
              <span>0{index + 1}</span>
              <button
                className="portfolio-service-image"
                type="button"
                aria-label={english ? `Enlarge ${servicio.nombre} makeup photo` : `Ampliar foto de maquillaje ${servicio.nombre}`}
                onClick={() => setEstiloAmpliado(servicio)}
              >
                <ImagenProducto
                  key={servicio.imagen}
                  src={servicio.imagen}
                  alt={english ? `${servicio.nombre} makeup look` : `Look de maquillaje ${servicio.nombre}`}
                />
                <span className="portfolio-service-image-hint">{english ? 'View larger' : 'Ver en grande'}</span>
              </button>
              <h3>{servicio.nombre}</h3>
              <p>{english ? servicio.descripcionEn : servicio.descripcionEs}</p>
              <Link to="/citas">{english ? 'Book this style' : 'Agenda este estilo'} →</Link>
            </article>
          ))}
        </div>
        <button className="portfolio-scroll-next" type="button" onClick={() => desplazarA('estilos')}>
          {english ? 'Keep scrolling' : 'Seguir bajando'} <span aria-hidden="true">↓</span>
        </button>
      </section>

      <section className="portfolio-index" id="estilos">
        <div className="portfolio-section-heading">
          <span className="section-kicker">{english ? 'Portfolio index' : 'Índice del portafolio'}</span>
          <h2>{english ? 'Find the look that feels like you.' : 'Encuentra el estilo que habla de ti.'}</h2>
        </div>
        <div className="portfolio-style-grid">
          {estilosPortafolio.map((estilo, index) => (
            <article key={estilo.nombre}>
              <span>0{index + 1}</span>
              <div>
                <h3>{estilo.nombre}</h3>
                <p>{english ? estilo.descripcionEn : estilo.descripcionEs}</p>
              </div>
            </article>
          ))}
        </div>
        <button className="portfolio-scroll-next" type="button" onClick={() => desplazarA('proceso')}>
          {english ? 'Keep scrolling' : 'Seguir bajando'} <span aria-hidden="true">↓</span>
        </button>
      </section>

      <section className="portfolio-process" id="proceso">
        <div className="portfolio-section-heading">
          <span className="section-kicker">{english ? 'The process' : 'EL PROCESO'}</span>
          <h2>{english ? 'Every detail has its moment.' : 'Cada detalle tiene su momento.'}</h2>
        </div>
        <ol>
          {pasos.map((paso, index) => (
            <li key={paso.tituloEs}>
              <figure className="portfolio-process-photo">
                <ImagenProducto
                  key={paso.imagen}
                  src={paso.imagen}
                  alt={english ? `${paso.tituloEn} makeup process` : `Paso ${paso.tituloEs} del proceso de maquillaje`}
                />
              </figure>
              <span>0{index + 1}</span>
              <h3>{english ? paso.tituloEn : paso.tituloEs}</h3>
              <p>{english ? paso.detalleEn : paso.detalleEs}</p>
            </li>
          ))}
        </ol>
        <button
          className="portfolio-scroll-next"
          type="button"
          onClick={() => desplazarA(maquilladoras.length > 1 ? 'equipo' : 'contacto')}
        >
          {english ? 'Keep scrolling' : 'Seguir bajando'} <span aria-hidden="true">↓</span>
        </button>
      </section>

      {maquilladoras.length > 1 && (
        <section className="portfolio-team" id="equipo">
          <div className="portfolio-section-heading">
            <span className="section-kicker">{english ? 'Our team' : 'Nuestro equipo'}</span>
            <h2>{english ? 'Meet the makeup artists.' : 'Conoce a las maquilladoras.'}</h2>
          </div>
          <div className="portfolio-team-grid">
            {maquilladoras.slice(1).map((maquilladora) => (
              <article key={maquilladora.id_maquilladora}>
                <ImagenProducto key={maquilladora.imagen} src={maquilladora.imagen} alt={maquilladora.nombre} />
                <h3>{maquilladora.nombre}</h3>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="portfolio-contact" id="contacto">
        <div>
          <span className="section-kicker">03 — {english ? 'Let’s talk' : 'Hablemos'}</span>
          <h2>{english ? 'Your ritual, our care.' : 'Tu ritual, nuestro cuidado.'}</h2>
          <p>
            {english
              ? 'Questions about your skin or a product? Our beauty team is ready to help.'
              : '¿Tienes dudas sobre tu piel o algún producto? Nuestro equipo de belleza está listo para ayudarte.'}
          </p>
        </div>
        <div className="portfolio-contact-details">
          <div className="portfolio-contact-info">
            <a href="mailto:hola@cosmeticlab.com">hola@cosmeticlab.com</a>
            <a href="tel:+573001234567">+57 300 123 4567</a>
            <span>{english ? 'Mon–Fri · 9:00–18:00' : 'Lun–Vie · 9:00–18:00'}</span>
          </div>
          <div className="portfolio-social-links" aria-label={english ? 'Social media' : 'Redes sociales'}>
            <span><span className="social-icon" aria-hidden="true">◎</span>Instagram</span>
            <span><span className="social-icon social-letter" aria-hidden="true">f</span>Facebook</span>
            <span><span className="social-icon" aria-hidden="true">♪</span>TikTok</span>
          </div>
        </div>
      </section>
      {estiloAmpliado && (
        <div className="portfolio-lightbox">
          <button
            className="portfolio-lightbox-backdrop"
            type="button"
            aria-label={english ? 'Close enlarged photo' : 'Cerrar foto ampliada'}
            onClick={() => setEstiloAmpliado(null)}
          />
          <section
            className="portfolio-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-lightbox-title"
          >
            <button
              className="portfolio-lightbox-close"
              type="button"
              autoFocus
              aria-label={english ? 'Close' : 'Cerrar'}
              onClick={() => setEstiloAmpliado(null)}
            >×</button>
            <ImagenProducto
              key={estiloAmpliado.imagen}
              src={estiloAmpliado.imagen}
              alt={english ? `${estiloAmpliado.nombre} makeup look` : `Look de maquillaje ${estiloAmpliado.nombre}`}
            />
            <div className="portfolio-lightbox-caption">
              <span className="section-kicker">{english ? 'Featured style' : 'Estilo destacado'}</span>
              <h2 id="portfolio-lightbox-title">{estiloAmpliado.nombre}</h2>
              <p>{english ? estiloAmpliado.descripcionEn : estiloAmpliado.descripcionEs}</p>
              <dl className="portfolio-lightbox-details">
                <div>
                  <dt>{english ? 'Ideal for' : 'Ideal para'}</dt>
                  <dd>{english ? estiloAmpliado.ocasionEn : estiloAmpliado.ocasionEs}</dd>
                </div>
                <div>
                  <dt>{english ? 'Finish' : 'Acabado'}</dt>
                  <dd>{english ? estiloAmpliado.acabadoEn : estiloAmpliado.acabadoEs}</dd>
                </div>
                <div>
                  <dt>{english ? 'Includes' : 'Incluye'}</dt>
                  <dd>{english ? estiloAmpliado.incluyeEn : estiloAmpliado.incluyeEs}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      )}
      {/* TODO(confirmar): falta el usuario oficial de Instagram para enlazar el portafolio. */}
    </main>
  );
};

export default HomeCosmeticLab;
