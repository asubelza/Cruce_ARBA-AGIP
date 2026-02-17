export interface Ingreso {
  _id: string;
  id?: string;
  fuente: string;
  cuit: string;
  monto: number;
  periodo: string;
  razon_social?: string;
  fecha_insert: string;
  fecha_conciliado?: string;
  conciliado: boolean;
  archivo_origen?: string;
}

export interface CruceOk {
  id: string;
  id_retencion: string;
  id_plataforma: string;
  cuit: string;
  monto: number;
  periodo_ret: string;
  periodo_plat: string;
  razon_social_ret?: string;
  razon_social_plat?: string;
  fecha_conciliado: string;
  archivo_origen?: string;
}

export interface MatchResult {
  ret_id: string;
  plat_id: string;
  cuit: string;
  monto_ret: number;
  monto_plat: number;
  periodo_ret: string;
  periodo_plat: string;
}

export interface StagingItem {
  ret_id: string;
  plat_id: string;
  cuit_ret: string;
  cuit_plat: string;
  monto_ret: number;
  monto_plat: number;
  periodo_ret: string;
  periodo_plat: string;
}

export interface Stats {
  pend_retencion: number;
  pend_plataforma: number;
  pend_totales: number;
  ok_historicos: number;
}