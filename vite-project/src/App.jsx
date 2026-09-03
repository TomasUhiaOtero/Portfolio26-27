import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import StatsBand from "./sections/StatsBand";
import Projects from "./sections/Projects";
import Experience from "./sections/Experience";
import Stack from "./sections/Stack";
import About from "./sections/About";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";
import { LanguageProvider } from "./i18n/LanguageProvider";

/**
 * Orden de secciones: los proyectos van inmediatamente después del hero.
 * Es lo que ha venido a ver quien abre esto, y antes quedaba en cuarto lugar,
 * detrás de "Sobre mí" y de cinco tarjetas de servicios genéricos.
 *
 * <header> y <footer> quedan fuera de <main>: los landmarks no se anidan.
 */
export default function App() {
  return (
    <LanguageProvider>
      <Nav />

      <main id="contenido">
        <Hero />
        <StatsBand />
        <Projects />
        <Experience />
        <Stack />
        <About />
        <Contact />
      </main>

      <Footer />
    </LanguageProvider>
  );
}
