import { Fragment } from "react";

/**
 * Parte un titular en palabras animables.
 *
 * Dos detalles que parecen menores y no lo son:
 *  - el espacio entre palabras va como nodo hermano del `<span>`, no dentro:
 *    si va dentro, `white-space` no puede romper la línea entre palabras y el
 *    titular se sale del contenedor en pantallas estrechas;
 *  - la línea lleva `clip-safe` (padding-bottom + margin-bottom negativos) para
 *    que `overflow-hidden` no recorte las descendentes de "p", "g" o "j".
 *
 * @param {string[]} lines Cada entrada es una línea del titular.
 */
export default function SplitWords({ lines, className = "" }) {
  return (
    <span className={className}>
      {lines.map((line, lineIndex) => (
        <span
          key={line + lineIndex}
          className="block overflow-hidden clip-safe"
        >
          {line.split(" ").map((word, wordIndex) => (
            <Fragment key={word + wordIndex}>
              {wordIndex > 0 && " "}
              <span data-word data-intro className="inline-block">
                {word}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}
