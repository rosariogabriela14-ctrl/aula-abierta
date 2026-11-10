/**
 * AULA ABIERTA — Mi Blog Docente
 * db.js — Módulo desacoplado de abstracción y persistencia (IndexedDB)
 * 
 * Diseñado con interfaz agnóstica para permitir sustituir fácilmente 
 * el almacenamiento local del navegador por llamadas a una API REST / Supabase.
 */

const DB_NAME = 'AulaAbiertaDB_v2';
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
    this._initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Almacén: Artículos (publicaciones)
        if (!db.objectStoreNames.contains('articles')) {
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('status', 'status', { unique: false });
          articleStore.createIndex('subject', 'subject', { unique: false });
          articleStore.createIndex('grade', 'grade', { unique: false });
          articleStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Comentarios
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('articleId', 'articleId', { unique: false });
          commentStore.createIndex('status', 'status', { unique: false }); // pending, approved, rejected, spam
          commentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Biblioteca Multimedia
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('category', 'category', { unique: false });
          mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Configuración y Sesión Demo
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this._seedInitialData();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error al inicializar IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ── Métodos internos sin await _initPromise (evitan deadlock en seed) ──
  _countRaw(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _putRaw(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async _seedInitialData() {
    const articlesCount = await this._countRaw('articles');
    if (articlesCount === 0) {
      // Sembrar datos educativos iniciales
      const defaultArticles = [
        {
          id: 'art-comprension-lectora',
          title: 'Antes, durante y después de leer: estrategias de comprensión lectora para 4.º, 5.º y 6.º grado',
          summary: 'Una secuencia para enseñar a los estudiantes a predecir, preguntar, aclarar y resumir, de modo que lean con propósito y comprendan lo que leen.',
          subject: 'Comprensión lectora',
          grade: '5to Primaria',
          readTime: 8,
          status: 'published', // 'published', 'draft', 'scheduled'
          coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Estantes de biblioteca con libros de lectura para el aula',
          author: 'Gabriela Del Rosario',
          role: 'Docente de Lengua Española',
          views: 0,
          createdAt: new Date('2026-10-20T08:30:00Z').getTime(),
          content: `
            <div style="background:linear-gradient(135deg,#e0f2fe,#eff6ff);padding:20px 24px;border-radius:12px;margin-bottom:24px;border-left:4px solid #0284c7;">
              <p style="margin:0 0 8px;font-weight:700;color:#0369a1;">📋 Ficha curricular de referencia</p>
              <p style="margin:4px 0;"><strong>Área:</strong> Lengua Española</p>
              <p style="margin:4px 0;"><strong>Competencia:</strong> Comunicativa — comprensión de textos escritos</p>
              <p style="margin:4px 0;"><strong>Indicador de logro:</strong> Aplica estrategias antes, durante y después de la lectura para comprender textos narrativos e informativos.</p>
              <p style="margin:4px 0;"><strong>Grados:</strong> 4.º, 5.º y 6.º de Primaria &nbsp;|&nbsp; <strong>Duración:</strong> 3 sesiones de 45 min</p>
            </div>

            <h2>1. Leer no es lo mismo que comprender</h2>
            <p>Un estudiante puede decodificar con fluidez cada palabra de un texto y, aun así, no poder contar de qué trataba. La comprensión lectora no aparece sola: se enseña, se modela y se practica. Cuando los niños y las niñas conocen estrategias concretas, leen con un propósito y se vuelven más autónomos.</p>
            <p>Una forma sencilla de organizar la enseñanza es pensar la lectura en tres momentos: <strong>antes</strong> de leer, <strong>durante</strong> la lectura y <strong>después</strong> de leer.</p>

            <blockquote style="border-left:4px solid #0284c7;padding:16px 20px;background:#f0f9ff;border-radius:0 8px 8px 0;margin:24px 0;">
              <p style="font-style:italic;margin:0 0 8px;">«Leer es conversar con el texto: cada pregunta que le hacemos nos devuelve una idea nueva.»</p>
              <cite style="color:#64748b;">— Pensamiento pedagógico de Aula Abierta</cite>
            </blockquote>

            <h2>2. Antes de leer: activar saberes y predecir</h2>
            <ul>
              <li><strong>Observar el paratexto:</strong> título, imágenes, subtítulos y portada. ¿De qué creen que tratará?</li>
              <li><strong>Activar saberes previos:</strong> ¿Qué sabemos ya sobre este tema? ¿Dónde lo hemos visto o escuchado?</li>
              <li><strong>Plantear un propósito:</strong> ¿Para qué vamos a leer este texto: para disfrutar, para informarnos o para seguir instrucciones?</li>
            </ul>

            <h2>3. Durante la lectura: preguntar, aclarar, conectar</h2>
            <ol>
              <li><strong>Pausas con pregunta:</strong> cada párrafo o página, el grupo se detiene y formula una pregunta sobre lo leído.</li>
              <li><strong>Aclarar vocabulario:</strong> subrayar las palabras desconocidas y deducir su significado por el contexto antes de buscar en el diccionario.</li>
              <li><strong>Conectar:</strong> relacionar lo que se lee con una experiencia propia, con otro texto o con lo que ocurre en la comunidad.</li>
              <li><strong>Visualizar:</strong> imaginar la escena y dibujarla brevemente en el cuaderno.</li>
            </ol>

            <h2>4. Después de leer: resumir, inferir y opinar</h2>
            <p>El cierre es el momento en que la comprensión se consolida. Algunas actividades que funcionan bien:</p>
            <ul>
              <li>Resumir el texto en tres oraciones: <em>inicio, nudo y desenlace</em> si es narrativo; <em>idea principal y dos detalles</em> si es informativo.</li>
              <li>Responder preguntas literales, inferenciales y críticas.</li>
              <li>Dar una opinión argumentada: «Estoy de acuerdo / no estoy de acuerdo porque…».</li>
            </ul>

            <div style="background:#eff6ff;padding:16px 20px;border-radius:10px;margin:24px 0;border:1px solid #bfdbfe;">
              <h4 style="margin:0 0 8px;color:#1e3a8a;">💡 Tres niveles de preguntas</h4>
              <p style="margin:0;"><strong>Literales</strong> (¿qué dice el texto?), <strong>inferenciales</strong> (¿qué quiere decir entre líneas?) y <strong>críticas</strong> (¿qué opino y por qué?). Conviene que cada lectura incluya al menos una pregunta de cada nivel.</p>
            </div>

            <h2>5. Secuencia didáctica: El taller del detective lector</h2>
            <p>Los estudiantes trabajan en equipos de cuatro y asumen roles rotativos: <strong>predictor</strong>, <strong>preguntón</strong>, <strong>aclarador</strong> y <strong>resumidor</strong>.</p>

            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #e2e8f0;margin:16px 0;">
              <h4 style="color:#1e40af;margin-top:0;">🧰 Materiales</h4>
              <ul>
                <li>Un texto breve por equipo (cuento, leyenda o artículo informativo adecuado al grado)</li>
                <li>Tarjetas con los cuatro roles</li>
                <li>Cuaderno o ficha de registro</li>
                <li>Marcadores o lápices de colores</li>
              </ul>

              <h4 style="color:#1e40af;">📝 Sesión 1 — Antes de leer (45 min)</h4>
              <ol>
                <li>Presentar el título y la imagen del texto sin leerlo todavía.</li>
                <li>Cada equipo escribe dos predicciones y una pregunta que espera responder.</li>
                <li>Compartir las predicciones con el grupo.</li>
              </ol>

              <h4 style="color:#1e40af;">🔍 Sesión 2 — Durante la lectura (45 min)</h4>
              <ol>
                <li>Leer el texto por tramos, con pausas para que cada rol intervenga.</li>
                <li>Anotar palabras nuevas y su significado deducido.</li>
                <li>Comprobar qué predicciones se cumplieron.</li>
              </ol>

              <h4 style="color:#1e40af;">✍️ Sesión 3 — Después de leer (45 min)</h4>
              <ol>
                <li>Redactar un resumen de tres oraciones.</li>
                <li>Responder una pregunta literal, una inferencial y una crítica.</li>
                <li>Compartir una opinión argumentada con el grupo.</li>
              </ol>
            </div>

            <h2>6. Actividad para la familia</h2>
            <div style="background:#fef3c7;padding:16px 20px;border-radius:10px;margin:16px 0;border:1px solid #fcd34d;">
              <p style="margin:0 0 12px;font-weight:700;color:#92400e;">🏠 Diez minutos de lectura compartida</p>
              <ol style="margin:0;">
                <li>Elegir un cuento, una noticia breve o un poema que guste a la familia.</li>
                <li>Antes de leer, adivinar de qué trata a partir del título.</li>
                <li>Leer por turnos y conversar: ¿qué fue lo que más te llamó la atención?</li>
                <li>Anotar en el cuaderno una palabra nueva y usarla en una oración.</li>
              </ol>
            </div>

            <h2>7. Evaluación formativa</h2>
            <div style="background:linear-gradient(135deg,#dbeafe,#e0f2fe);padding:20px;border-radius:10px;margin:24px 0;">
              <h4 style="margin:0 0 12px;color:#1e3a8a;">📊 Rúbrica de comprensión lectora</h4>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                  <tr style="background:#2563eb;color:#fff;">
                    <th style="padding:8px;text-align:left;border-radius:6px 0 0 0;">Criterio</th>
                    <th style="padding:8px;text-align:center;">Avanzado (4)</th>
                    <th style="padding:8px;text-align:center;">Satisfactorio (3)</th>
                    <th style="padding:8px;text-align:center;border-radius:0 6px 0 0;">En proceso (2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:#eff6ff;">
                    <td style="padding:8px;font-weight:600;">Predice y verifica</td>
                    <td style="padding:8px;text-align:center;">Predice con argumentos y verifica con evidencias del texto</td>
                    <td style="padding:8px;text-align:center;">Predice y comprueba sus ideas</td>
                    <td style="padding:8px;text-align:center;">Predice con ayuda</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;font-weight:600;">Resume</td>
                    <td style="padding:8px;text-align:center;">Resume con sus palabras e incluye las ideas principales</td>
                    <td style="padding:8px;text-align:center;">Resume con algunas ideas principales</td>
                    <td style="padding:8px;text-align:center;">Copia fragmentos del texto</td>
                  </tr>
                  <tr style="background:#eff6ff;">
                    <td style="padding:8px;font-weight:600;">Opina con argumentos</td>
                    <td style="padding:8px;text-align:center;">Fundamenta su opinión con razones del texto</td>
                    <td style="padding:8px;text-align:center;">Da su opinión con una razón</td>
                    <td style="padding:8px;text-align:center;">Expresa su opinión sin justificarla</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background:#f0f9ff;padding:16px 20px;border-radius:10px;margin:16px 0;border:1px solid #bae6fd;">
              <p style="margin:0;font-weight:600;color:#0369a1;">📖 Referencias sugeridas</p>
              <ul style="margin:8px 0 0;color:#334155;">
                <li>Solé, I. (1992). <em>Estrategias de lectura</em>. Barcelona: Graó.</li>
                <li>Currículo del Nivel Primario, Área de Lengua Española. Ministerio de Educación de la República Dominicana (MINERD).</li>
              </ul>
            </div>
          `,
          tags: ['ComprensiónLectora', 'EstrategiasDeLectura', 'LenguaEspañola', 'EvaluaciónFormativa']
        },
        {
          id: 'art-primeras-lecturas',
          title: 'Primeras lecturas en 1.º grado: del sonido a la sílaba y de la sílaba a la palabra',
          summary: 'Actividades lúdicas para acompañar el inicio de la lectura y la escritura con conciencia fonológica, sílabas y palabras significativas.',
          subject: 'Lectura inicial',
          grade: '1ro Primaria',
          readTime: 6,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Niña y niño aprendiendo a leer con libros ilustrados en el aula',
          author: 'Gabriela Del Rosario',
          role: 'Docente de Lengua Española',
          views: 0,
          createdAt: new Date('2026-10-14T10:15:00Z').getTime(),
          content: `
            <h2>Escuchar antes de leer</h2>
            <p>En primer grado, aprender a leer comienza por aprender a escuchar los sonidos de las palabras. La conciencia fonológica —reconocer que las palabras se componen de sonidos y sílabas— es una base valiosa para la lectura y la escritura.</p>
            <h2>Actividades para empezar</h2>
            <ol>
              <li><strong>Palmas y sílabas:</strong> dar una palmada por cada sílaba de los nombres de los estudiantes (<em>Ma-ría</em>, <em>Jo-sé</em>).</li>
              <li><strong>Caja de sonidos:</strong> sacar objetos pequeños y decir con qué sonido inicial comienzan.</li>
              <li><strong>Tarjetas de sílabas:</strong> combinar sílabas para formar palabras conocidas (<em>ma + sa = masa</em>).</li>
              <li><strong>Mi primera palabra:</strong> escribir y dibujar una palabra significativa para cada niño y niña.</li>
            </ol>
            <p>Conviene combinar estas actividades con la lectura en voz alta de cuentos breves, para que los pequeños disfruten del lenguaje mientras lo exploran.</p>
          `,
          tags: ['LecturaInicial', 'ConcienciaFonológica', 'PrimerGrado']
        },
        {
          id: 'art-oraciones-claras',
          title: 'Cómo construir oraciones claras y coherentes en la escuela primaria',
          summary: 'Guía de sintaxis lúdica para niños: identificación del sujeto y predicado mediante fichas manipulables.',
          subject: 'Gramática y ortografía',
          grade: '4to Primaria',
          readTime: 4,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Cuaderno escolar con ejercicios caligráficos y gramaticales',
          author: 'Gabriela Del Rosario',
          role: 'Docente de Lengua Española',
          views: 0,
          createdAt: new Date('2026-10-08T12:00:00Z').getTime(),
          content: `
            <h2>El juego de los bloques sintácticos</h2>
            <p>Aprender la concordancia entre género y número es mucho más sencillo cuando los alumnos construyen oraciones como si fuesen trenes con vagones: ¿Quién realiza la acción? ¿Qué acción realiza? ¿Dónde o cómo ocurre?</p>
            <ol>
              <li>Entregar fichas de colores: azul para el sujeto, verde para el verbo y amarillo para el complemento.</li>
              <li>Pedir al equipo que arme una oración con sentido y la lea en voz alta.</li>
              <li>Cambiar una ficha y comentar qué ocurre con el significado y la concordancia.</li>
            </ol>
          `,
          tags: ['LenguaEspañola', 'RedacciónInicial', 'Gramática']
        },
        {
          id: 'art-escritura-creativa',
          title: 'Taller de escritura creativa: cuentos con inicio, nudo y desenlace',
          summary: 'Una secuencia para que los estudiantes de 6.º grado planifiquen, escriban y revisen sus propios cuentos.',
          subject: 'Escritura creativa',
          grade: '6to Primaria',
          readTime: 6,
          status: 'draft',
          coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Pila de libros de cuentos sobre una mesa de lectura',
          author: 'Gabriela Del Rosario',
          role: 'Docente de Lengua Española',
          views: 0,
          createdAt: new Date('2026-10-25T09:00:00Z').getTime(),
          content: `
            <h2>Escribir para contar lo que imaginamos</h2>
            <p>Borrador en construcción. Pendiente de anexar la rúbrica de escritura y la ficha de revisión entre pares.</p>
          `,
          tags: ['EscrituraCreativa', 'Cuento', 'ProducciónDeTextos']
        }
      ];

      for (const art of defaultArticles) {
        await this._putRaw('articles', art);
      }

      // Sembrar comentarios
      const defaultComments = [
        {
          id: 'comm-1',
          articleId: 'art-comprension-lectora',
          authorName: 'Prof. Manuel Grullón',
          authorType: 'teacher', // teacher, family, student, guest
          authorBadge: 'Docente Verificado',
          schoolInfo: 'Docente de 5.º grado',
          content: 'Excelente secuencia. Probé los roles de predictor y resumidor con mi grupo de 5.º y la participación mejoró mucho. ¿Tiene recomendaciones de textos breves para empezar?',
          status: 'pending', // pending, approved, rejected, spam
          createdAt: new Date(Date.now() - 45 * 60 * 1000).getTime(),
          teacherReply: null
        },
        {
          id: 'comm-2',
          articleId: 'art-comprension-lectora',
          authorName: 'Estefanía Peña',
          authorType: 'family',
          authorBadge: 'Familia Comunidad',
          schoolInfo: 'Madre de estudiante de 5to A',
          content: 'Hicimos los diez minutos de lectura compartida en casa y mi hijo se animó a contarme el cuento con sus propias palabras. ¡Gracias por la actividad para la familia!',
          status: 'approved',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).getTime(),
          teacherReply: '¡Qué alegría, Estefanía! Leer en familia fortalece el gusto por los libros. ¡Un abrazo cálido para su hijo!'
        },
        {
          id: 'comm-3',
          articleId: 'art-primeras-lecturas',
          authorName: 'Visitante_982',
          authorType: 'guest',
          authorBadge: 'Anónimo',
          schoolInfo: 'IP: 179.53.*.* • Sin credenciales',
          content: 'Para resolver rápido sus tareas miren este link gratis en hxxp://descarga-examenes-rd.cc y ganen puntos sin estudiar.',
          status: 'pending', // flagged
          isSpamAlert: true,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).getTime(),
          teacherReply: null
        }
      ];

      for (const comm of defaultComments) {
        await this._putRaw('comments', comm);
      }

      // Sembrar biblioteca multimedia inicial
      const defaultMedia = [
        {
          id: 'media-organizador-lectura',
          title: 'Organizador gráfico: antes, durante y después de leer',
          category: 'infografias',
          url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 420,
          dimensions: '1200x800',
          altText: 'Estantes con libros de lectura para el aula',
          associatedArticle: 'Antes, durante y después de leer: estrategias de comprensión lectora',
          createdAt: new Date('2026-10-14').getTime()
        },
        {
          id: 'media-escritura-creativa',
          title: 'Portada del taller de escritura creativa',
          category: 'portadas',
          url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 310,
          dimensions: '1200x800',
          altText: 'Pila de libros de cuentos sobre una mesa de lectura',
          associatedArticle: 'Taller de escritura creativa: cuentos con inicio, nudo y desenlace',
          createdAt: new Date('2026-10-20').getTime()
        },
        {
          id: 'media-lectura-inicial',
          title: 'Fichas de sílabas y palabras para 1.º grado',
          category: 'fichas',
          url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 280,
          dimensions: '1080x720',
          altText: 'Niños aprendiendo a leer con libros ilustrados',
          associatedArticle: 'Primeras lecturas en 1.º grado',
          createdAt: new Date('2026-11-02').getTime()
        }
      ];

      for (const med of defaultMedia) {
        await this._putRaw('media', med);
      }

      // Sembrar perfil docente por defecto (editable desde perfil.html)
      const settingsCount = await this._countRaw('settings');
      if (settingsCount === 0) {
        await this._putRaw('settings', {
          key: 'teacherProfile',
          name: 'Gabriela Del Rosario',
          title: '',
          role: 'Docente de Lengua Española',
          specialty: 'Lengua Española • 1.º, 4.º, 5.º y 6.º grado',
          school: 'Distrito 1001',
          yearsExperience: 0,
          bio: 'Fomento la lectura, fortalezco la escritura y desarrollo las competencias comunicativas de mis estudiantes.',
          photoUrl: '',
          updatedAt: Date.now()
        });
      }
    }
  }

  // ── Método faltante: actualizar artículo (usado por lectura.html para vistas) ──
  async updateArticle(id, updates) {
    const article = await this.get('articles', id);
    if (!article) return null;
    Object.assign(article, updates, { updatedAt: Date.now() });
    await this.put('articles', article);
    return article;
  }

  // Operaciones CRUD genéricas sobre IndexedDB
  async get(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Métodos específicos de Dominio Educativo (Facade)
  async getPublishedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'published').sort((a, b) => b.createdAt - a.createdAt);
  }

  async getArticleById(id) {
    return await this.get('articles', id);
  }

  async saveArticle(articleData) {
    if (!articleData.id) {
      articleData.id = 'art-' + Date.now();
      articleData.createdAt = Date.now();
      articleData.views = 0;
    }
    articleData.updatedAt = Date.now();
    await this.put('articles', articleData);
    return articleData;
  }

  async deleteArticle(id) {
    // Soft-delete: mover a papelera (status = 'trash') en vez de borrar permanentemente
    const article = await this.get('articles', id);
    if (!article) return false;
    article.previousStatus = article.status;
    article.status = 'trash';
    article.trashedAt = Date.now();
    await this.put('articles', article);
    return true;
  }

  async restoreArticle(id) {
    const article = await this.get('articles', id);
    if (!article || article.status !== 'trash') return null;
    article.status = article.previousStatus || 'draft';
    delete article.trashedAt;
    delete article.previousStatus;
    await this.put('articles', article);
    return article;
  }

  async permanentDeleteArticle(id) {
    // Eliminación permanente real (solo para vaciar papelera)
    const comments = await this.getAll('comments');
    for (const c of comments) {
      if (c.articleId === id) {
        await this.delete('comments', c.id);
      }
    }
    return await this.delete('articles', id);
  }

  async getTrashedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'trash').sort((a, b) => b.trashedAt - a.trashedAt);
  }

  async getCommentsByArticle(articleId, onlyApproved = true) {
    const all = await this.getAll('comments');
    return all.filter(c => c.articleId === articleId && (!onlyApproved || c.status === 'approved'))
              .sort((a, b) => b.createdAt - a.createdAt);
  }

  async addComment(commentData) {
    if (!commentData.id) {
      commentData.id = 'comm-' + Date.now();
      commentData.createdAt = Date.now();
      commentData.status = 'pending'; // moderación requerida por defecto
    }
    await this.put('comments', commentData);
    return commentData;
  }

  async updateCommentStatus(id, newStatus, replyText = null) {
    const comm = await this.get('comments', id);
    if (!comm) return null;
    comm.status = newStatus;
    if (replyText !== null) {
      comm.teacherReply = replyText;
    }
    await this.put('comments', comm);
    return comm;
  }

  async deleteComment(id) {
    return await this.delete('comments', id);
  }

  async getAllMedia() {
    const items = await this.getAll('media');
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveMedia(mediaData) {
    if (!mediaData.id) {
      mediaData.id = 'media-' + Date.now();
      mediaData.createdAt = Date.now();
    }
    await this.put('media', mediaData);
    return mediaData;
  }

  async deleteMedia(id) {
    return await this.delete('media', id);
  }

  // ── Perfil Docente ──
  async getTeacherProfile() {
    const profile = await this.get('settings', 'teacherProfile');
    // Retornar defaults si no existe
    return profile || {
      key: 'teacherProfile',
      name: 'Docente',
      title: '',
      role: '',
      specialty: '',
      school: '',
      yearsExperience: 0,
      bio: '',
      photoUrl: '',
      updatedAt: Date.now()
    };
  }

  async updateTeacherProfile(updates) {
    const current = await this.getTeacherProfile();
    Object.assign(current, updates, { key: 'teacherProfile', updatedAt: Date.now() });
    await this.put('settings', current);
    return current;
  }
}

// Instancia global exportable
window.AulaAbiertaDB = new StorageService();

// === XSS Sanitization Utilities ===

// Sanitize rich HTML content — strips scripts, iframes, event handlers, dangerous tags
// Use for article body content that legitimately contains formatting (h2, p, strong, etc.)
function sanitizeHTML(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  // Remove dangerous tags
  div.querySelectorAll('script, iframe, object, embed, form, input').forEach(el => el.remove());
  // Remove event handlers and javascript: URLs
  div.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return div.innerHTML;
}
window.sanitizeHTML = sanitizeHTML;

// Escape plain text for safe insertion into HTML templates
// Use for author names, titles, summaries, comments — any user string in a template literal
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHTML = escapeHTML;

// === Non-blocking Toast Notification ===
window.showToast = function(message, type) {
  if (typeof type === 'string' && !['success','error','warning','info'].includes(type)) type = 'info';
  const toast = document.createElement('div');
  toast.className = 'toast-notification toast-' + (type || 'info');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;color:#fff;font-size:14px;z-index:9999;animation:fadeIn .3s ease;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
  toast.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
};
