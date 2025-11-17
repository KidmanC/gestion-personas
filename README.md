# Sistema de Gestión de Datos Personales

Sistema de microservicios para la gestión de datos personales construido con Node.js y Docker.

## Arquitectura

El sistema está compuesto por 5 microservicios independientes:

- **Microservicio de Creación** (3001) - Crear personas con validaciones
- **Microservicio de Consulta** (3002) - Consultar personas (activación por demanda)
- **Microservicio de Actualización** (3003) - Actualizar datos personales
- **Microservicio de Eliminación** (3004) - Eliminar personas
- **Servicio de Logs** (3005) - Registro centralizado de transacciones

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Docker
- Docker Compose

### Ejecutar el sistema
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd gestion-personas

# Ejecutar todos los servicios
docker-compose up -d

# Ejecutar solo servicios base (sin consulta)
docker-compose up -d --scale query-service=0
```

# Endpoints Principales

## Creación de Personas

```http
POST http://localhost:3001/persons
```
## Consulta de Personas

```http
GET http://localhost:3002/persons
GET http://localhost:3002/persons/{documentNumber}
```

## Actualización

```http
PUT http://localhost:3003/persons/{documentNumber}
```

## Eliminación

```http
DELETE http://localhost:3004/persons/{documentNumber}
```

## Logs

```http
GET http://localhost:3005/logs
DELETE http://localhost:3005/logs
```

Características
- Validaciones completas de datos

- Sistema de logs centralizado

- Arquitectura de microservicios

- Contenedores Docker independientes

- Comunicación entre servicios

- Servicio de consulta escalable