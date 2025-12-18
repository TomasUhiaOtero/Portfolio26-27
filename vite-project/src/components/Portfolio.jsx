import { motion } from 'framer-motion'
import ScrollAnimation from './ScrollAnimation'
import { useState } from 'react';

function Portfolio() {

  const [selectedFilter, setSelectedFilter] = useState("Todos");

  const projects = [
    {
      id: 1,
      category: 'Todos, Front-End, Back-End',
      image: '/61shots_so.webp',
      title: 'Asistente-Estudio-IA',
      description: 'Crea tests, flashcards o resumenes interactivos a partir de OpenAPI.',
      link: "https://github.com/TomasUhiaOtero/Asistente-IA"
    },
    {
      id: 2,
      category: 'Todos, Front-End, Back-End',
      image: '/kairosmk2w.webp',
      title: 'Kairós',
      description: 'Web dedicada a la gestión de tareas y eventos utilizando APIs locales y externas.',
      link: "https://github.com/TomasUhiaOtero/Kairos"
    },
    {
      id: 3,
      category: 'Todos, Front-End, Back-End',
      image: "/mockup_final_.webp",
      title: 'TopMusic',
      description: 'Web que muestra tops musicales y permite descubir nuevos generos musicales.',
      link: "https://github.com/TomasUhiaOtero/Proyecto-CSDAM"
    },
    {
      id: 4,
      category: 'Todos, Back-End',
      image: '/7044158.webp',
      title: 'API REST Star Wars',
      description: 'Creación de la BBDD, Endpoints y pruebas con Postman',
      link: "https://github.com/TomasUhiaOtero/API-REST-StarWars"
    },
    {
      id: 5,
      category: 'Todos, Front-End',
      image: '/mk_portfolio_opt.webp',
      title: 'Este portfolio',
      description: '',
      link: "https://github.com/TomasUhiaOtero/portfolio25-26"
    },
    {
      id: 6,
      category: 'Todos, Front-End',
      image: '/mockup_conversor.png',
      title: 'Conversor de Monedas',
      description: 'Aplicacion que usa una API externa para conversión de divisas',
      link: "https://github.com/TomasUhiaOtero/Conversor-monedas"
    },
    {
      id: 7,
      category: 'Todos, Front-End',
      image: '/3_enraya_.webp',
      title: '3 en Raya Interactivo',
      description: 'El Clásico juego de 3 en raya con JS y CSS',
      link: "https://github.com/TomasUhiaOtero/SpringBoot/tree/master/libreria-springboot/libreria"
    },
    {
      id: 8,
      category: 'Todos, Back-End',
      image: '/4804282.jpg',
      title: 'Servicio Springboot libreria',
      description: 'Aplicación basada en arquitectura MVC',
      link: "https://github.com/TomasUhiaOtero/Practice"
    },
  ];

  const filters = ['Todos', 'Front-End', 'Back-End'];

  const filteredProjects = selectedFilter === "Todos" ? projects : projects.filter((p) => p.category.includes(selectedFilter));

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.25, 0, 1],
      },
    }),
  }

  return (
    <ScrollAnimation>
      <section className="section" id="portfolio">
        <ScrollAnimation delay={0.1}>
          <div className="section-title">
            <h2>Mi Portfolio</h2>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="portfolio-filter">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)} // 👈 cambia el filtro
                className={`filter-btn ${filter === selectedFilter ? "active" : ""
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </ScrollAnimation>

        <div className="portfolio-grid">
          {filteredProjects.map((project, index) => (
            <motion.a
              key={project.id}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-item cursor-pointer"
              data-category={project.category}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            >
              <img src={project.image} alt={project.title} className="portfolio-img" />
              <div className="portfolio-overlay">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </section>
    </ScrollAnimation>
  );
}

export default Portfolio;

