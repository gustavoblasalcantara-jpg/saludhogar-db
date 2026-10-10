-- ============================================================
-- SaludHogar — Esquema de base de datos (Neon DB / PostgreSQL)
-- Ejecutar completo en el SQL Editor de Neon (console.neon.tech)
-- o vía: psql "$DATABASE_URL" -f db/schema.sql
-- ============================================================

-- Administradores del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- se guarda un hash SHA-256, nunca texto plano
    rol VARCHAR(20) DEFAULT 'admin'
);

-- Catálogo de Salud
CREATE TABLE IF NOT EXISTS productos_salud (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    imagen_url VARCHAR(255),
    solicitudes_count INT DEFAULT 0
);

-- Registro de Tráfico Web
CREATE TABLE IF NOT EXISTS registro_visitas (
    id SERIAL PRIMARY KEY,
    ip_visitante VARCHAR(45),
    pagina_visitada VARCHAR(100) DEFAULT 'inicio',
    fecha_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registro de Interacciones por Producto
CREATE TABLE IF NOT EXISTS solicitudes_productos (
    id SERIAL PRIMARY KEY,
    id_producto INT REFERENCES productos_salud(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización analítica en Neon DB
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON registro_visitas(fecha_visita);
CREATE INDEX IF NOT EXISTS idx_solicitudes_producto ON solicitudes_productos(id_producto);

-- ============================================================
-- Datos semilla
-- ============================================================

-- 1) Genera el hash de tu contraseña de administrador ANTES de ejecutar
--    este INSERT (requiere Node.js instalado localmente):
--
--      npm install
--      node db/generate-admin-hash.js "TuContraseñaSegura123"
--
--    Eso imprime algo como "a1b2c3...:9f8e7d...". Pega ese valor completo
--    (con los dos puntos incluidos) en lugar de REEMPLAZA_CON_TU_HASH.
INSERT INTO usuarios (nombre, correo, contrasena, rol)
VALUES (
    'Administrador SaludHogar',
    'admin@saludhogar.pe',
    'REEMPLAZA_CON_TU_HASH',
    'admin'
)
ON CONFLICT (correo) DO NOTHING;

-- Catálogo base. El ORDEN importa: los ids 1..7 deben coincidir con el mapa
-- SERVICE_PRODUCT_IDS de js/script.js (1 Enfermería, 2 Medicina, 3 Obstetricia,
-- 4 Psicología, 5 Fisioterapia, 6 Telemedicina, 7 Farmacia).
-- Es idempotente: si ya hay productos, no vuelve a insertarlos.
INSERT INTO productos_salud (nombre, categoria, descripcion, precio, imagen_url)
SELECT * FROM (VALUES
  ('Enfermería a domicilio', 'Enfermería', 'Cuidado de adulto mayor, curación de heridas, control de funciones vitales e inyectables.', 25.00, 'assets/images/producto-enfermeria.svg'),
  ('Medicina general a domicilio', 'Medicina', 'Consulta presencial o por telemedicina, evaluación y receta médica.', 35.00, 'assets/images/producto-medicina.svg'),
  ('Control prenatal', 'Obstetricia', 'Control prenatal y postnatal, orientación en lactancia.', 30.00, 'assets/images/producto-obstetricia.svg'),
  ('Sesión de psicología', 'Psicología', 'Acompañamiento emocional para el paciente y la familia cuidadora.', 40.00, 'assets/images/producto-psicologia.svg'),
  ('Fisioterapia a domicilio', 'Fisioterapia', 'Rehabilitación y terapia física con equipo portátil.', 32.00, 'assets/images/producto-fisioterapia.svg'),
  ('Telemedicina', 'Telemedicina', 'Consulta médica por videollamada para seguimientos y segundas opiniones.', 28.00, 'assets/images/producto-telemedicina.svg')
) AS v(nombre, categoria, descripcion, precio, imagen_url)
WHERE NOT EXISTS (SELECT 1 FROM productos_salud);

-- 7.º servicio (Farmacia). Si ya ejecutaste una versión anterior de este script,
-- basta con correr este INSERT: no duplica nada.
INSERT INTO productos_salud (nombre, categoria, descripcion, precio, imagen_url)
SELECT 'Farmacia', 'Farmacia', 'Entrega de medicamentos recetados e insumos junto con la visita del profesional.', 0.00, 'assets/images/producto-farmacia.svg'
WHERE NOT EXISTS (SELECT 1 FROM productos_salud WHERE categoria = 'Farmacia');

-- Verifica que los ids queden así antes de publicar:
--   SELECT id, categoria FROM productos_salud ORDER BY id;
