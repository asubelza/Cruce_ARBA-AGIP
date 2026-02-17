# Project Context for AI Assistants

## Goal

The user is migrating a Python Tkinter desktop application called "Cruce ARBA-AGIP" to a modern web application. The app reconciles data between two Excel sheets (RETENCION/RETIENCION and PLATAFORMA) by matching records based on CUIT and amount. 

**Stack**:
- **Frontend**: React with Material-UI (MUI)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Infrastructure**: Docker + Docker Compose + Nginx

## Instructions

- User explicitly stated: "usar branches separadas y NO mergear hasta que todo funcione OK"
- Current branch: `feature/web-migration-mongodb-docker`
- Git backup was created at commit 49398c4 before changes

## Discoveries

1. **Excel Sheet Name Typo**: The Excel file has a sheet named "RETIENCION" (with extra I) instead of "RETENCION" - the code handles both
2. **openpyxl Engine**: Need to explicitly use `engine='openpyxl'` when reading Excel files
3. **MongoDB Collections**: `ingresos` (raw data) and `cruces_ok` (reconciled matches)

## Completed

- Docker Compose setup with 4 services (mongodb, backend, frontend, nginx)
- FastAPI backend with all endpoints (upload, stats, pendientes, auto-match, staging, confirm)
- React frontend with Material-UI (MUI) components
- Nginx as reverse proxy
- Excel upload handles "RETIENCION" typo
- Fixed pymongo/motor compatibility (pymongo 4.9.2 + motor 3.6.0)

## Left to Do

1. Test Excel upload end-to-end
2. Test complete workflow in Docker
3. Only merge to main after everything works

## Relevant files / directories

**Backend**:
- `backend/main.py` - FastAPI application with all endpoints
- `backend/Dockerfile` - Python 3.11 slim image
- `backend/requirements.txt` - Dependencies with compatible pymongo/motor versions

**Frontend**:
- `frontend/package.json` - React, MUI, recharts dependencies
- `frontend/src/App.tsx` - Main React component with MUI
- `frontend/src/components/` - Header, StatsCards, FileUpload, DataTable, StagingTable (all MUI)
- `frontend/src/hooks/useApi.ts` - API hooks for backend communication
- `frontend/src/main.tsx` - MUI ThemeProvider setup

**Infrastructure**:
- `docker-compose.yml` - 4 services: mongodb, backend, frontend, nginx
- `nginx/nginx.conf` - Reverse proxy configuration

**Original Desktop App** (preserved):
- `cruce_app.py` - Original Tkinter application

**Branch**: `feature/web-migration-mongodb-docker`
