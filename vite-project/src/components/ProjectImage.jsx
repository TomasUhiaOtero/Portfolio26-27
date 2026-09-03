/**
 * Imagen de proyecto en tres formatos y dos resoluciones.
 *
 * La versión anterior servía el original: 3,3 MB y 1920×1440 para pintar una
 * caja de 411×250, sin `lazy` y sin `width`/`height`. Aquí:
 *  - AVIF primero, WebP como alternativa;
 *  - `srcset` de 800/1600 px para que el móvil no descargue la grande;
 *  - `width`/`height` explícitos, que reservan el hueco y evitan saltos de
 *    layout mientras carga.
 *
 * Todas las fuentes se generan a 16:10, así que las dimensiones son fijas.
 */
const WIDTH = 1600;
const HEIGHT = 1000;

export default function ProjectImage({
  base,
  alt,
  sizes = "100vw",
  priority = false,
  className = "",
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={`${base}-1600.avif`} sizes={sizes} />
      <source
        type="image/webp"
        srcSet={`${base}-800.webp 800w, ${base}-1600.webp 1600w`}
        sizes={sizes}
      />
      <img
        src={`${base}-1600.webp`}
        alt={alt}
        width={WIDTH}
        height={HEIGHT}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`h-full w-full object-cover ${className}`}
      />
    </picture>
  );
}
