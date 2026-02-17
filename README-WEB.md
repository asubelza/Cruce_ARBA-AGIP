# Cruce ARBA-AGIP - Versión Web Moderna

## 🚀 Stack Tecnológico

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB 7.0
- **Infraestructura**: Docker + Docker Compose + Nginx

## 📁 Estructura del Proyecto

```
Cruce_ARBA-AGIP/
├── docker-compose.yml          # Orquestación de contenedores
├── backend/                    # API FastAPI
│   ├── Dockerfile
│   ├── main.py                # Endpoints principales
│   └── requirements.txt
├── frontend/                   # React App
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # App principal
│   └── package.json
├── nginx/                      # Reverse proxy
│   └── nginx.conf
└── mongodb_data/              # Volumen persistente
```

## 🚀 Instrucciones de Uso

### 1. Iniciar todos los servicios

```bash
docker-compose up --build
```

### 2. Acceder a la aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Docs**: http://localhost/docs

### 3. Detener los servicios

```bash
docker-compose down
```

## 📊 Funcionalidades

### ✅ Implementadas:
- **Carga de Excel**: Arrastrar o seleccionar archivos Excel
- **Auto-Match**: Detección automática de coincidencias por CUIT + monto
- **Selección Manual**: Doble-click para seleccionar registros
- **Staging Cartesiano**: Genera todas las combinaciones posibles
- **Confirmación**: Persiste cruces en MongoDB
- **Estadísticas en tiempo real**: Cards con contadores actualizados
- **UI Moderna**: Tema oscuro tipo Instagram

### 🎯 Flujo de Trabajo:
1. Cargar archivo Excel (hojas RETENCION y PLATAFORMA)
2. Clic en "Cargar Pendientes" para ver los datos
3. "Auto-Match" detecta automáticos (van al staging)
4. Seleccionar manualmente los que faltan
5. "Generar Staging" crea combinaciones cartesianas
6. "Confirmar" persiste todo en la base de datos

## 🔧 Variables de Entorno

```env
# MongoDB
MONGODB_URL=mongodb://admin:password123@mongodb:27017/cruce_arba_agip?authSource=admin

# Backend
DEBUG=False
```

## 🛠️ Desarrollo

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📦 API Endpoints

- `GET /` - Health check
- `GET /stats` - Estadísticas
- `GET /pendientes` - Listar pendientes
- `POST /upload` - Subir Excel
- `POST /auto-match` - Ejecutar auto-match
- `POST /staging/generate` - Generar staging
- `POST /cruces/confirmar` - Confirmar cruces
- `GET /cruces/historicos` - Ver históricos
- `DELETE /limpiar-bd` - Limpiar BD

## 🎨 Características Visuales

- **Tema**: Oscuro tipo Instagram
- **Colores**: Negro (#000000), gris oscuro (#121212), azul (#0095f6), verde (#00d26a)
- **Tipografía**: Inter (system-ui)
- **Responsive**: Funciona en desktop y tablet

## 📝 Notas

- MongoDB guarda datos en volumen persistente (`mongodb_data/`)
- Nginx actúa como reverse proxy
- Hot reload activo en desarrollo (frontend y backend)
- CORS configurado para desarrollo local

## 🔥 Para producción

1. Cambiar contraseñas de MongoDB
2. Configurar HTTPS en Nginx
3. Agregar autenticación JWT
4. Usar MongoDB Atlas o instancia dedicada
5. Configurar backups automáticos