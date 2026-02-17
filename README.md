# Cruce ARBA-AGIP

Sistema web para conciliación de retenciones entre ARBA y AGIP. Permite cargar archivos Excel y realizar cruces automáticos y manuales entre registros de RETENCION y PLATAFORMA.

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 18 + TypeScript + Material-UI |
| Backend | FastAPI + Python 3.11 |
| Base de datos | MongoDB 7.0 |
| Infraestructura | Docker Compose + Nginx |

## Inicio Rápido

### Requisitos
- Docker Desktop instalado
- Puerto 80 disponible

### Ejecutar

```bash
# Clonar el repositorio
git clone https://github.com/asubelza/Cruce_ARBA-AGIP.git
cd Cruce_ARBA-AGIP

# Iniciar aplicación
docker-compose up -d

# Abrir en navegador
# http://localhost
```

### Detener

```bash
docker-compose down
```

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Frontend  │     │   Backend   │
│   :80       │     │   React     │────▶│   FastAPI   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   MongoDB   │
                                        │   :27017    │
                                        └─────────────┘
```

## Estructura del Proyecto

```
Cruce_ARBA-AGIP/
├── docker-compose.yml      # Orquestación de contenedores
├── backend/
│   ├── Dockerfile
│   ├── main.py             # API endpoints
│   └── requirements.txt    # Dependencias Python
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/     # Componentes MUI
│   │   ├── hooks/          # Custom hooks API
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Componente principal
│   └── package.json
├── nginx/
│   └── nginx.conf          # Configuración reverse proxy
└── cruce_app_backup.py     # Backup app original Tkinter
```

## Funcionalidades

### Carga de Excel
- Drag & drop o click para seleccionar
- Lee hojas RETENCION/RETIENCION y PLATAFORMA
- Detecta automáticamente columnas CUIT, Monto, Período

### Auto-Match
- Busca coincidencias por CUIT + Monto (tolerancia $0.01)
- Vista previa antes de confirmar
- Selección individual de matches

### Cruce Manual
- Selección de registros individuales
- Generación cartesiana (1x1, 1xN, NxN)
- Vista previa de staging

### Gestión de Datos
- Estadísticas en tiempo real
- Limpiar base de datos con confirmación
- Histórico de cruces confirmados

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats` | Estadísticas generales |
| GET | `/api/pendientes/retencion` | Registros RETENCION pendientes |
| GET | `/api/pendientes/plataforma` | Registros PLATAFORMA pendientes |
| POST | `/api/upload` | Cargar archivo Excel |
| POST | `/api/auto-match` | Buscar coincidencias automáticas |
| POST | `/api/cruces/confirmar-auto` | Confirmar auto-matches |
| POST | `/api/staging/generate` | Generar staging manual |
| POST | `/api/cruces/confirmar` | Confirmar cruces manuales |
| DELETE | `/api/limpiar-bd` | Limpiar base de datos |

## Desarrollo Local

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000
```

### MongoDB
```bash
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0
```

## Formato Excel Requerido

### Hoja RETENCION
| Columna | Descripción |
|---------|-------------|
| CUIT | CUIT del contribuyente |
| Importe | Monto de retención |
| PERIODO TOMADO | Período fiscal |

### Hoja PLATAFORMA
| Columna | Descripción |
|---------|-------------|
| CUIT | CUIT del contribuyente |
| Importe | Monto en plataforma |
| PERIODO | Período fiscal |

## Producción

Para desplegar en producción:

1. Cambiar contraseñas en `docker-compose.yml`
2. Configurar HTTPS en `nginx/nginx.conf`
3. Agregar autenticación
4. Configurar backups de MongoDB
5. Usar MongoDB Atlas o instancia dedicada

## Licencia

Privado - Uso interno Estudio Contable JY
