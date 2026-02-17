from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import pandas as pd
import os
from decimal import Decimal

app = FastAPI(title="Cruce ARBA-AGIP API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:password123@localhost:27017/cruce_arba_agip?authSource=admin")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.cruce_arba_agip

# Pydantic Models
class Ingreso(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    fuente: str
    cuit: str
    monto: float
    periodo: str
    razon_social: Optional[str] = None
    fecha_insert: datetime
    fecha_conciliado: Optional[datetime] = None
    conciliado: bool = False
    archivo_origen: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class CruceOk(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    id_retencion: str
    id_plataforma: str
    cuit: str
    monto: float
    periodo_ret: str
    periodo_plat: str
    razon_social_ret: Optional[str] = None
    razon_social_plat: Optional[str] = None
    fecha_conciliado: datetime
    archivo_origen: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class MatchResult(BaseModel):
    ret_id: str
    plat_id: str
    cuit: str
    monto_ret: float
    monto_plat: float
    periodo_ret: str
    periodo_plat: str

class StagingItem(BaseModel):
    ret_id: str
    plat_id: str
    cuit_ret: str
    cuit_plat: str
    monto_ret: float
    monto_plat: float
    periodo_ret: str
    periodo_plat: str

@app.get("/")
async def root():
    return {"message": "Cruce ARBA-AGIP API", "version": "1.0.0"}

@app.get("/stats")
async def get_stats():
    """Get statistics about pending records and matches"""
    pend_ret = await db.ingresos.count_documents({"fuente": "RETIENCION", "conciliado": False})
    pend_plat = await db.ingresos.count_documents({"fuente": "PLATAFORMA", "conciliado": False})
    ok_historicos = await db.cruces_ok.count_documents({})
    
    return {
        "pend_retencion": pend_ret,
        "pend_plataforma": pend_plat,
        "pend_totales": pend_ret + pend_plat,
        "ok_historicos": ok_historicos
    }

@app.get("/pendientes", response_model=List[Ingreso])
async def get_pendientes(fuente: Optional[str] = None):
    """Get pending records"""
    query = {"conciliado": False}
    if fuente:
        query["fuente"] = fuente
    
    cursor = db.ingresos.find(query).sort("monto", -1)
    records = []
    async for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(Ingreso(**doc))
    return records

@app.get("/pendientes/retencion", response_model=List[Ingreso])
async def get_pendientes_retencion():
    """Get pending RETENCION records"""
    cursor = db.ingresos.find({"fuente": "RETIENCION", "conciliado": False}).sort("monto", -1)
    records = []
    async for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(Ingreso(**doc))
    return records

@app.get("/pendientes/plataforma", response_model=List[Ingreso])
async def get_pendientes_plataforma():
    """Get pending PLATAFORMA records"""
    cursor = db.ingresos.find({"fuente": "PLATAFORMA", "conciliado": False}).sort("monto", -1)
    records = []
    async for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(Ingreso(**doc))
    return records

@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    """Upload Excel file and process data"""
    try:
        # Read Excel file
        contents = await file.read()
        
        # Save temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Read sheets with explicit engine
        xl = pd.ExcelFile(temp_path, engine='openpyxl')
        print(f"Sheets found: {xl.sheet_names}")
        
        # Find RETENCION and PLATAFORMA sheets
        sheet_ret = None
        sheet_plat = None
        
        for sheet_name in xl.sheet_names:
            upper_name = sheet_name.upper()
            if 'RETENCION' in upper_name or 'RETIENCION' in upper_name:
                sheet_ret = sheet_name
            elif 'PLATAFORMA' in upper_name:
                sheet_plat = sheet_name
        
        if not sheet_ret or not sheet_plat:
            raise HTTPException(status_code=400, detail=f"Hojas encontradas: {xl.sheet_names}. Se requieren RETENCION y PLATAFORMA")
        
        # Read data
        df_ret = pd.read_excel(temp_path, sheet_name=sheet_ret)
        df_plat = pd.read_excel(temp_path, sheet_name=sheet_plat)
        
        # Clean column names
        df_ret.columns = [c.strip() for c in df_ret.columns]
        df_plat.columns = [c.strip() for c in df_plat.columns]
        
        # Process RETENCION
        count_ret = 0
        for _, row in df_ret.iterrows():
            try:
                monto = float(row.get('Monto Retenido', 0))
                if monto > 0:
                    doc = {
                        "fuente": "RETIENCION",
                        "cuit": str(int(row['CUIT'])),
                        "monto": monto,
                        "periodo": str(row.get('PERIODO TOMADO', '')),
                        "razon_social": str(row.get('Razón Social', '')),
                        "fecha_insert": datetime.now(),
                        "conciliado": False,
                        "archivo_origen": file.filename
                    }
                    await db.ingresos.insert_one(doc)
                    count_ret += 1
            except:
                continue
        
        # Process PLATAFORMA
        count_plat = 0
        for _, row in df_plat.iterrows():
            try:
                monto = float(row.get('Importe', 0))
                if monto > 0:
                    doc = {
                        "fuente": "PLATAFORMA",
                        "cuit": str(int(row['CUIT'])),
                        "monto": monto,
                        "periodo": str(row.get('PERIODO', '')),
                        "razon_social": str(row.get('Razón Social', '')),
                        "fecha_insert": datetime.now(),
                        "conciliado": False,
                        "archivo_origen": file.filename
                    }
                    await db.ingresos.insert_one(doc)
                    count_plat += 1
            except:
                continue
        
        # Clean temp file
        os.remove(temp_path)
        
        return {
            "message": "Datos cargados exitosamente",
            "retencion_count": count_ret,
            "plataforma_count": count_plat
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingresos/manual")
async def create_ingreso_manual(ingreso: Ingreso):
    """Create manual entry"""
    doc = {
        "fuente": ingreso.fuente,
        "cuit": ingreso.cuit,
        "monto": ingreso.monto,
        "periodo": ingreso.periodo,
        "razon_social": ingreso.razon_social,
        "fecha_insert": datetime.now(),
        "conciliado": False,
        "archivo_origen": "MANUAL"
    }
    result = await db.ingresos.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Registro creado exitosamente"}

@app.post("/auto-match")
async def auto_match():
    """Auto-match records by CUIT and amount (preview only, not saved)"""
    ret_cursor = db.ingresos.find({"fuente": "RETIENCION", "conciliado": False})
    plat_cursor = db.ingresos.find({"fuente": "PLATAFORMA", "conciliado": False})
    
    ret_records = []
    plat_records = []
    
    async for doc in ret_cursor:
        doc['_id'] = str(doc['_id'])
        ret_records.append(doc)
    
    async for doc in plat_cursor:
        doc['_id'] = str(doc['_id'])
        plat_records.append(doc)
    
    matches = []
    matched_ret_ids = set()
    matched_plat_ids = set()
    
    for ret in ret_records:
        if ret['_id'] in matched_ret_ids:
            continue
        
        for plat in plat_records:
            if plat['_id'] in matched_plat_ids:
                continue
            
            if ret['cuit'] == plat['cuit'] and abs(ret['monto'] - plat['monto']) <= 0.01:
                matches.append(MatchResult(
                    ret_id=ret['_id'],
                    plat_id=plat['_id'],
                    cuit=ret['cuit'],
                    monto_ret=ret['monto'],
                    monto_plat=plat['monto'],
                    periodo_ret=ret['periodo'],
                    periodo_plat=plat['periodo']
                ))
                matched_ret_ids.add(ret['_id'])
                matched_plat_ids.add(plat['_id'])
                break
    
    return {"matches": matches, "count": len(matches)}

class ConfirmMatchItem(BaseModel):
    ret_id: str
    plat_id: str
    cuit: str
    monto_ret: float
    monto_plat: float
    periodo_ret: str
    periodo_plat: str

@app.post("/cruces/confirmar-auto")
async def confirmar_auto_match(cruces: List[ConfirmMatchItem]):
    """Confirm auto-matched records"""
    fecha = datetime.now()
    confirmados = 0
    
    for cruce in cruces:
        match_doc = {
            "id_retencion": cruce.ret_id,
            "id_plataforma": cruce.plat_id,
            "cuit": cruce.cuit,
            "monto": cruce.monto_ret,
            "periodo_ret": cruce.periodo_ret,
            "periodo_plat": cruce.periodo_plat,
            "razon_social_ret": "",
            "razon_social_plat": "",
            "fecha_conciliado": fecha,
            "archivo_origen": "AUTO-MATCH"
        }
        await db.cruces_ok.insert_one(match_doc)
        
        await db.ingresos.update_one(
            {"_id": ObjectId(cruce.ret_id)},
            {"$set": {"conciliado": True, "fecha_conciliado": fecha}}
        )
        await db.ingresos.update_one(
            {"_id": ObjectId(cruce.plat_id)},
            {"$set": {"conciliado": True, "fecha_conciliado": fecha}}
        )
        
        confirmados += 1
    
    return {"message": f"{confirmados} cruces confirmados exitosamente"}

class StagingRequest(BaseModel):
    ret_ids: List[str] = []
    plat_ids: List[str] = []

@app.post("/staging/generate", response_model=List[StagingItem])
async def generate_staging(request: Request):
    """Generate cartesian product staging"""
    body = await request.body()
    print(f"DEBUG RAW BODY: {body}")
    
    try:
        data = await request.json()
        print(f"DEBUG PARSED: ret_ids={data.get('ret_ids')}, plat_ids={data.get('plat_ids')}")
    except Exception as e:
        print(f"DEBUG JSON ERROR: {e}")
        return []
    
    ret_ids = data.get('ret_ids', [])
    plat_ids = data.get('plat_ids', [])
    
    if not ret_ids or not plat_ids:
        print(f"DEBUG: Empty arrays - ret_ids={ret_ids}, plat_ids={plat_ids}")
        return []
    
    ret_records = []
    plat_records = []
    
    for ret_id in ret_ids:
        try:
            doc = await db.ingresos.find_one({"_id": ObjectId(ret_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
                ret_records.append(doc)
        except Exception as e:
            print(f"Error finding ret_id {ret_id}: {e}")
    
    for plat_id in plat_ids:
        try:
            doc = await db.ingresos.find_one({"_id": ObjectId(plat_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
                plat_records.append(doc)
        except Exception as e:
            print(f"Error finding plat_id {plat_id}: {e}")
    
    staging = []
    for ret in ret_records:
        for plat in plat_records:
            staging.append(StagingItem(
                ret_id=ret['_id'],
                plat_id=plat['_id'],
                cuit_ret=ret['cuit'],
                cuit_plat=plat['cuit'],
                monto_ret=ret['monto'],
                monto_plat=plat['monto'],
                periodo_ret=ret['periodo'],
                periodo_plat=plat['periodo']
            ))
    
    return staging

@app.post("/cruces/confirmar")
async def confirmar_cruces(cruces: List[StagingItem]):
    """Confirm staged matches"""
    fecha = datetime.now()
    confirmados = 0
    
    for cruce in cruces:
        # Insert match
        match_doc = {
            "id_retencion": cruce.ret_id,
            "id_plataforma": cruce.plat_id,
            "cuit": cruce.cuit_ret,
            "monto": cruce.monto_ret,
            "periodo_ret": cruce.periodo_ret,
            "periodo_plat": cruce.periodo_plat,
            "razon_social_ret": "",
            "razon_social_plat": "",
            "fecha_conciliado": fecha,
            "archivo_origen": "STAGING"
        }
        await db.cruces_ok.insert_one(match_doc)
        
        # Update ingresos as conciliado
        await db.ingresos.update_one(
            {"_id": ObjectId(cruce.ret_id)},
            {"$set": {"conciliado": True, "fecha_conciliado": fecha}}
        )
        await db.ingresos.update_one(
            {"_id": ObjectId(cruce.plat_id)},
            {"$set": {"conciliado": True, "fecha_conciliado": fecha}}
        )
        
        confirmados += 1
    
    return {"message": f"{confirmados} cruces confirmados exitosamente"}

@app.get("/cruces/historicos", response_model=List[CruceOk])
async def get_cruces_historicos(skip: int = 0, limit: int = 100):
    """Get historical matches"""
    cursor = db.cruces_ok.find().sort("fecha_conciliado", -1).skip(skip).limit(limit)
    records = []
    async for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(CruceOk(**doc))
    return records

@app.delete("/limpiar-bd")
async def limpiar_bd():
    """Clear all data from database"""
    await db.ingresos.delete_many({})
    await db.cruces_ok.delete_many({})
    return {"message": "Base de datos limpiada exitosamente"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)