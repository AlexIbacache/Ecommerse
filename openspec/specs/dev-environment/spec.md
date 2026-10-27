# dev-environment Specification

## Purpose
Define el entorno de desarrollo contenerizado del e-commerce: tres servicios Docker que se comunican entre sí, persisten datos ante reinicios y se levantan con un solo comando.

## Requirements

### Requirement: Orquestación de servicios con Docker Compose

El proyecto SHALL definir mediante Docker Compose al menos tres servicios independientes —frontend (Next.js), backend (Node.js) y base de datos (PostgreSQL)— que se comunican a través de una red interna de Docker.

#### Scenario: Levantado del entorno completo

- **WHEN** un desarrollador ejecuta `docker compose up` desde la raíz del proyecto
- **THEN** los tres servicios (frontend, backend, db) inician y quedan accesibles en sus puertos publicados

#### Scenario: Comunicación interna entre servicios

- **WHEN** el backend necesita conectarse a la base de datos
- **THEN** lo hace mediante el nombre del servicio `db` como host dentro de la red interna de Docker, sin depender de `localhost`

### Requirement: Persistencia de datos ante reinicios

La base de datos SHALL almacenar sus datos en un volumen nombrado de Docker, de modo que la información sobreviva a la detención y recreación de contenedores.

#### Scenario: Datos sobreviven a un reinicio de contenedores

- **WHEN** se inserta un registro en la base de datos, se ejecuta `docker compose down` y luego `docker compose up`
- **THEN** el registro insertado sigue presente al consultarlo

### Requirement: Arranque ordenado por salud de la base de datos

El servicio backend SHALL esperar a que la base de datos esté saludable antes de iniciar, mediante healthcheck y dependencia condicionada.

#### Scenario: Backend no inicia antes que la base de datos

- **WHEN** se levanta el entorno desde cero con volúmenes limpios
- **THEN** el backend inicia únicamente después de que el healthcheck de la base de datos reporta estado saludable, sin errores de conexión en su arranque

### Requirement: Configuración por variables de entorno

El proyecto SHALL proveer un archivo `.env.example` con todas las variables necesarias sin credenciales reales, y los servicios SHALL leer su configuración desde variables de entorno. El backend MUST rechazar el arranque si falta una variable obligatoria.

#### Scenario: Levantado con configuración de ejemplo

- **WHEN** un desarrollador copia `.env.example` a `.env`, completa los valores y ejecuta `docker compose up`
- **THEN** el entorno levanta sin modificar archivos de código

#### Scenario: Variable obligatoria ausente

- **WHEN** el backend inicia sin una variable de entorno obligatoria (por ejemplo la cadena de conexión a la base de datos)
- **THEN** el proceso falla al arrancar con un error explícito que identifica la variable faltante

### Requirement: Verificación de salud de los servicios

El backend SHALL exponer un endpoint de salud y el frontend SHALL responder HTTP 200 en su ruta raíz, permitiendo verificar que el entorno quedó operativo.

#### Scenario: Backend saludable

- **WHEN** se realiza `GET /health` al backend una vez levantado el entorno
- **THEN** responde HTTP 200 indicando que el servicio y su conexión a la base de datos están operativos
