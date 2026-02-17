import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import pandas as pd
import sqlite3
from datetime import datetime
import os
import re

class CruceApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Cruce ARBA-AGIP")
        self.root.geometry("1300x800")
        
        self.db_path = "cruce_data.db"
        self.init_db()
        
        self.archivo_actual = None
        self.dark_mode = False
        self.ok_este_cruce = []
        self.cruces_staged = []
        
        # Nuevas variables para sistema de pending y selección
        self.selected_ret_ids = set()
        self.selected_plat_ids = set()
        self.ret_pending_map = {}
        self.plat_pending_map = {}
        
        self.setup_ui()
        self.actualizar_estadisticas()
        
        self.root.mainloop()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''CREATE TABLE IF NOT EXISTS ingresos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fuente TEXT, cuit TEXT, monto REAL, periodo TEXT,
            razon_social TEXT, fecha_insert TEXT, fecha_conciliado TEXT,
            conciliado INTEGER DEFAULT 0, archivo_origen TEXT
        )''')
        
        c.execute('''CREATE TABLE IF NOT EXISTS cruces_ok (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_retencion INTEGER, id_plataforma INTEGER,
            cuit TEXT, monto REAL, periodo_ret TEXT, periodo_plat TEXT,
            razon_social_ret TEXT, razon_social_plat TEXT,
            fecha_conciliado TEXT, archivo_origen TEXT
        )''')
        
        conn.commit()
        conn.close()
    
    def setup_ui(self):
        # Colores tipo Instagram
        self.colors = {
            'bg': '#000000', 'fg': '#fafafa', 'header_bg': '#000000',
            'card_bg': '#121212', 'card_fg': '#fafafa',
            'success': '#00d26a', 'warning': '#ffb700',
            'danger': '#ed4956', 'primary': '#0095f6',
            'accent': '#E1306C', 'surface': '#262626'
        }
        
        self.root.configure(bg=self.colors['bg'])
        
        # Header
        header = tk.Frame(self.root, bg=self.colors['header_bg'], height=50)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        
        tk.Label(header, text="CRUCE ARBA - AGIP", font=("Segoe UI", 14, "bold"),
                bg=self.colors['header_bg'], fg='white').pack(side=tk.LEFT, padx=20, pady=10)
        
        self.btn_theme = tk.Button(header, text="🌙", command=self.toggle_theme,
                bg='#34495e', fg='white', relief=tk.FLAT, padx=10)
        self.btn_theme.pack(side=tk.RIGHT, padx=20, pady=10)
        
        main = tk.Frame(self.root, bg=self.colors['bg'], padx=15, pady=15)
        main.pack(fill=tk.BOTH, expand=True)
        
        # File selection
        file_frame = tk.LabelFrame(main, text="Seleccionar Archivo", bg=self.colors['card_bg'],
                fg=self.colors['card_fg'], font=("Segoe UI", 10, "bold"), padx=10, pady=10)
        file_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.entry = tk.Entry(file_frame, font=("Segoe UI", 10), bg=self.colors['surface'], 
                             fg=self.colors['fg'], insertbackground=self.colors['fg'])
        self.entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        tk.Button(file_frame, text="Examinar", command=self.seleccionar_archivo,
                bg=self.colors['primary'], fg='white', relief=tk.FLAT).pack(side=tk.LEFT, padx=5)
        
        tk.Button(file_frame, text="Cargar", command=self.cargar_datos,
                bg=self.colors['success'], fg='white', relief=tk.FLAT,
                font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        tk.Button(file_frame, text="+ Manual", command=self.carga_manual,
                bg=self.colors['warning'], fg='black', relief=tk.FLAT).pack(side=tk.LEFT, padx=5)
        
        # Stats
        stats_frame = tk.LabelFrame(main, text="Estadísticas", bg=self.colors['card_bg'],
                fg=self.colors['card_fg'], font=("Segoe UI", 10, "bold"), padx=15, pady=10)
        stats_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.lbl_stats = []
        labels = [
            ("Pend. RETIENCION:", "warning"),
            ("Pend. PLATAFORMA:", "warning"),
            ("Pend. Totales:", "accent"),
            ("OK Históricos:", "success"),
        ]
        
        for i, (text, color) in enumerate(labels):
            lbl = tk.Label(stats_frame, text=text + " 0", font=("Segoe UI", 10),
                bg=self.colors['card_bg'], fg=self.colors[color])
            lbl.pack(side=tk.LEFT, padx=15)
            self.lbl_stats.append(lbl)
        
        # Selección frame
        sel_frame = tk.LabelFrame(main, text="Selección para Cruce (doble clic en filas)", 
                bg=self.colors['card_bg'], fg=self.colors['card_fg'], 
                font=("Segoe UI", 10, "bold"), padx=10, pady=5)
        sel_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.lbl_sel_ret = tk.Label(sel_frame, text="RET: $0.00 (0)", 
                font=("Segoe UI", 10, "bold"), bg=self.colors['primary'], fg="white", padx=10, pady=5)
        self.lbl_sel_ret.pack(side=tk.LEFT, padx=20)
        
        self.lbl_sel_plat = tk.Label(sel_frame, text="PLAT: $0.00 (0)", 
                font=("Segoe UI", 10, "bold"), bg=self.colors['success'], fg="white", padx=10, pady=5)
        self.lbl_sel_plat.pack(side=tk.LEFT, padx=20)
        
        self.lbl_diferencia = tk.Label(sel_frame, text="Dif: $0.00", 
                font=("Segoe UI", 11, "bold"), bg=self.colors['danger'], fg="white", padx=10, pady=5)
        self.lbl_diferencia.pack(side=tk.LEFT, padx=20)
        
        # Trees para RET y PLAT
        from tkinter import PanedWindow
        paned = PanedWindow(main, orient='horizontal', bg=self.colors['bg'])
        paned.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        frame_ret = tk.Frame(paned, bg=self.colors['card_bg'])
        frame_plat = tk.Frame(paned, bg=self.colors['card_bg'])
        
        tk.Label(frame_ret, text="📄 RETENCION (pendientes)", font=("Segoe UI", 11, "bold"),
                bg=self.colors['primary'], fg="white", pady=5).pack(fill=tk.X)
        tk.Label(frame_plat, text="📄 PLATAFORMA (pendientes)", font=("Segoe UI", 11, "bold"),
                bg=self.colors['success'], fg="white", pady=5).pack(fill=tk.X)
        
        cols = ("CUIT", "Monto", "Período")
        self.tree_ret = ttk.Treeview(frame_ret, columns=cols, show="headings", height=12)
        self.tree_plat = ttk.Treeview(frame_plat, columns=cols, show="headings", height=12)
        
        for col in cols:
            self.tree_ret.heading(col, text=col)
            self.tree_ret.column(col, width=140 if col == "CUIT" else 120)
            self.tree_plat.heading(col, text=col)
            self.tree_plat.column(col, width=140 if col == "CUIT" else 120)
        
        self.tree_ret.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(5,2), pady=5)
        self.tree_plat.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(2,5), pady=5)
        
        self.tree_ret.tag_configure("SEL", background="#d4edda")
        self.tree_plat.tag_configure("SEL", background="#d4edda")

        self.tree_ret.bind("<Double-1>", lambda e: self.toggle_bd_selection('ret'))
        self.tree_plat.bind("<Double-1>", lambda e: self.toggle_bd_selection('plat'))
        
        scroll_ret = tk.Scrollbar(frame_ret, orient=tk.VERTICAL, command=self.tree_ret.yview)
        scroll_ret.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree_ret.configure(yscrollcommand=scroll_ret.set)
        
        scroll_plat = tk.Scrollbar(frame_plat, orient=tk.VERTICAL, command=self.tree_plat.yview)
        scroll_plat.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree_plat.configure(yscrollcommand=scroll_plat.set)
        
        paned.add(frame_ret, minsize=500)
        paned.add(frame_plat, minsize=500)
        
        # Staging panel
        staging_frame = tk.LabelFrame(main, text="Staging de Cruces (Cartesiano)", 
                bg=self.colors['card_bg'], fg=self.colors['card_fg'], 
                font=("Segoe UI", 10, "bold"), padx=10, pady=5)
        staging_frame.pack(fill=tk.X, pady=(0, 10))
        
        cols_staging = ("RET_ID", "PLAT_ID", "CUIT_RET", "CUIT_PLAT", "MONTO_RET", "MONTO_PLAT", 
                       "PERIODO_RET", "PERIODO_PLAT")
        self.tree_staging = ttk.Treeview(staging_frame, columns=cols_staging, show="headings", height=5)
        
        for col in cols_staging:
            self.tree_staging.heading(col, text=col)
            self.tree_staging.column(col, width=100 if 'ID' in col else 120)
        
        self.tree_staging.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        scroll_staging = tk.Scrollbar(staging_frame, orient=tk.VERTICAL, command=self.tree_staging.yview)
        scroll_staging.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree_staging.configure(yscrollcommand=scroll_staging.set)
        
        # Botones staging
        staging_btn_frame = tk.Frame(staging_frame, bg=self.colors['card_bg'])
        staging_btn_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=5)
        
        tk.Button(staging_btn_frame, text="Generar Staging", command=self.generate_cartesian_staging,
                bg="#9b59b6", fg='white', relief=tk.FLAT, padx=10, pady=5).pack(fill=tk.X, pady=2)
        
        tk.Button(staging_btn_frame, text="Confirmar Staged", command=self.confirmar_estaged,
                bg=self.colors['success'], fg='white', relief=tk.FLAT, padx=10, pady=5).pack(fill=tk.X, pady=2)
        
        tk.Button(staging_btn_frame, text="Limpiar Staging", command=self.limpiar_staging,
                bg=self.colors['danger'], fg='white', relief=tk.FLAT, padx=10, pady=5).pack(fill=tk.X, pady=2)
        
        # Botones principales
        btn_frame = tk.Frame(main, bg=self.colors['bg'])
        btn_frame.pack(fill=tk.X, pady=5)
        
        tk.Button(btn_frame, text="Cargar Pendientes BD", command=self.load_pending_from_bd, 
                 bg=self.colors['primary'], fg='white', relief=tk.FLAT, padx=12, pady=6).pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="Auto-Match", command=self.auto_match, 
                 bg="#16a085", fg='white', relief=tk.FLAT, padx=12, pady=6).pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="Exportar Históricos", command=self.exportar_historicos,
                bg=self.colors['primary'], fg='white', relief=tk.FLAT, padx=15, pady=8).pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="Ver Pendientes", command=self.ver_pendientes,
                bg=self.colors['warning'], fg='black', relief=tk.FLAT, padx=15, pady=8).pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="Limpiar BD", command=self.limpiar_bd,
                bg=self.colors['danger'], fg='white', relief=tk.FLAT, padx=15, pady=8).pack(side=tk.RIGHT, padx=5)
    
    def toggle_theme(self):
        if self.dark_mode:
            self.colors = {'bg': '#f5f5f5', 'fg': '#333', 'header_bg': '#2c3e50',
                'card_bg': '#fff', 'success': '#27ae60', 'warning': '#f39c12',
                'danger': '#e74c3c', 'primary': '#3498db'}
            self.root.configure(bg=self.colors['bg'])
            self.btn_theme.config(text="Oscuro")
            self.dark_mode = False
        else:
            self.colors = {'bg': '#1e1e1e', 'fg': '#e0e0e0', 'header_bg': '#0d0d0d',
                'card_bg': '#2d2d2d', 'success': '#2ecc71', 'warning': '#f1c40f',
                'danger': '#e74c3c', 'primary': '#3498db'}
            self.root.configure(bg=self.colors['bg'])
            self.btn_theme.config(text="Claro")
            self.dark_mode = True
    
    def actualizar_estadisticas(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        pend_ret = c.execute("SELECT COUNT(*) FROM ingresos WHERE fuente='RETIENCION' AND conciliado=0").fetchone()[0]
        pend_plat = c.execute("SELECT COUNT(*) FROM ingresos WHERE fuente='PLATAFORMA' AND conciliado=0").fetchone()[0]
        pend_total = pend_ret + pend_plat
        
        ok_historicos = c.execute("SELECT COUNT(*) FROM cruces_ok").fetchone()[0]
        
        conn.close()
        
        self.lbl_stats[0].config(text=f"Pend. RETIENCION: {pend_ret}")
        self.lbl_stats[1].config(text=f"Pend. PLATAFORMA: {pend_plat}")
        self.lbl_stats[2].config(text=f"Pend. Totales: {pend_total}")
        self.lbl_stats[3].config(text=f"OK Históricos: {ok_historicos}")
    
    def seleccionar_archivo(self):
        f = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx *.xls")])
        if f:
            self.archivo_actual = f
            self.entry.delete(0, tk.END)
            self.entry.insert(0, f)
    
    def cargar_datos(self):
        if not self.archivo_actual:
            messagebox.showwarning("Aviso", "Seleccione un archivo Excel")
            return
        
        try:
            self.ok_este_cruce = []
            
            xl = pd.ExcelFile(self.archivo_actual)
            hr = [s for s in xl.sheet_names if 'RETENCION' in s.upper()][0]
            hp = [s for s in xl.sheet_names if 'PLATAFORMA' in s.upper()][0]
            
            df_r = pd.read_excel(xl, hr)
            df_p = pd.read_excel(xl, hp)
            df_r.columns = [c.strip() for c in df_r.columns]
            df_p.columns = [c.strip() for c in df_p.columns]
            
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            archivo = os.path.basename(self.archivo_actual)
            
            for _, row in df_r.iterrows():
                try:
                    monto = float(row.get('Monto Retenido', 0))
                    if monto > 0:
                        c.execute('''INSERT OR IGNORE INTO ingresos 
                            (fuente, cuit, monto, periodo, fecha_insert, archivo_origen)
                            VALUES (?, ?, ?, ?, ?, ?)''',
                            ('RETIENCION', str(int(row['CUIT'])), monto,
                             str(row.get('PERIODO TOMADO', '')), fecha, archivo))
                except: pass
            
            for _, row in df_p.iterrows():
                try:
                    monto = float(row.get('Importe', 0))
                    if monto > 0:
                        c.execute('''INSERT OR IGNORE INTO ingresos 
                            (fuente, cuit, monto, periodo, fecha_insert, archivo_origen)
                            VALUES (?, ?, ?, ?, ?, ?)''',
                            ('PLATAFORMA', str(int(row['CUIT'])), monto,
                             str(row.get('PERIODO', '')), fecha, archivo))
                except: pass
            
            conn.commit()
            conn.close()
            
            messagebox.showinfo("OK", "Datos cargados. Use 'Cargar Pendientes BD' para verlos.")
            
        except Exception as e:
            messagebox.showerror("Error", str(e))
    

    
    def exportar_historicos(self):
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql("SELECT * FROM cruces_ok ORDER BY fecha_conciliado DESC", conn)
        conn.close()
        
        if df.empty:
            messagebox.showinfo("Info", "No hay cruces históricos")
            return
        
        df_export = df.rename(columns={
            'cuit': 'CUIT',
            'monto': 'Monto',
            'periodo_ret': 'Período RETENCION',
            'periodo_plat': 'Período PLATAFORMA',
            'razon_social_ret': 'Razón Social RET',
            'razon_social_plat': 'Razón Social PLAT',
            'fecha_conciliado': 'Fecha Conciliado',
            'archivo_origen': 'Archivo Origen'
        })
        
        f = filedialog.asksaveasfilename(defaultextension=".xlsx",
            initialfile=f"Cruce_Historicos_{datetime.now().strftime('%Y%m%d')}.xlsx")
        if f:
            df_export.to_excel(f, index=False)
            messagebox.showinfo("OK", f"Exportado a {f}")
    
    def ver_pendientes(self):
        conn = sqlite3.connect(self.db_path)
        df_ret = pd.read_sql("""
            SELECT fuente, cuit, monto, periodo, razon_social 
            FROM ingresos WHERE fuente='RETIENCION' AND conciliado=0 
            ORDER BY monto DESC
        """, conn)
        df_plat = pd.read_sql("""
            SELECT fuente, cuit, monto, periodo, razon_social 
            FROM ingresos WHERE fuente='PLATAFORMA' AND conciliado=0 
            ORDER BY monto DESC
        """, conn)
        conn.close()
        
        if df_ret.empty and df_plat.empty:
            messagebox.showinfo("Info", "No hay pendientes")
            return
        
        top = tk.Toplevel(self.root)
        top.title("Registros Pendientes")
        top.geometry("1000x600")
        
        paned = tk.PanedWindow(top, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        frame_ret = tk.Frame(paned)
        frame_plat = tk.Frame(paned)
        
        tk.Label(frame_ret, text=f"RETIENCION ({len(df_ret)} pendientes)", 
                font=("Segoe UI", 11, "bold"), bg="#3498db", fg="white").pack(fill=tk.X)
        tk.Label(frame_plat, text=f"PLATAFORMA ({len(df_plat)} pendientes)", 
                font=("Segoe UI", 11, "bold"), bg="#27ae60", fg="white").pack(fill=tk.X)
        
        tree_ret = ttk.Treeview(frame_ret, columns=("CUIT", "Monto", "Período"), show="headings", height=15)
        for col in ("CUIT", "Monto", "Período"):
            tree_ret.heading(col, text=col)
            tree_ret.column(col, width=150 if col == "CUIT" else 120)
        
        tree_ret.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        for _, row in df_ret.iterrows():
            tree_ret.insert('', tk.END, values=(
                row['cuit'], f"{row['monto']:,.2f}", row['periodo']
            ))
        
        tree_plat = ttk.Treeview(frame_plat, columns=("CUIT", "Monto", "Período"), show="headings", height=15)
        for col in ("CUIT", "Monto", "Período"):
            tree_plat.heading(col, text=col)
            tree_plat.column(col, width=150 if col == "CUIT" else 120)
        
        tree_plat.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        for _, row in df_plat.iterrows():
            tree_plat.insert('', tk.END, values=(
                row['cuit'], f"{row['monto']:,.2f}", row['periodo']
            ))
        
        scroll_ret = ttk.Scrollbar(frame_ret, orient=tk.VERTICAL, command=tree_ret.yview)
        scroll_ret.pack(side=tk.RIGHT, fill=tk.Y)
        tree_ret.configure(yscrollcommand=scroll_ret.set)
        
        scroll_plat = ttk.Scrollbar(frame_plat, orient=tk.VERTICAL, command=tree_plat.yview)
        scroll_plat.pack(side=tk.RIGHT, fill=tk.Y)
        tree_plat.configure(yscrollcommand=scroll_plat.set)
        
        paned.add(frame_ret, minsize=400)
        paned.add(frame_plat, minsize=400)
        
        total = len(df_ret) + len(df_plat)
        tk.Label(top, text=f"Total: {total} pendientes", pady=5).pack()
    
    def limpiar_bd(self):
        if messagebox.askyesno("Confirmar", "¿Limpiar toda la base de datos?"):
            conn = sqlite3.connect(self.db_path)
            conn.execute("DELETE FROM cruces_ok")
            conn.execute("DELETE FROM ingresos")
            conn.commit()
            conn.close()
            self.ok_este_cruce = []
            self.selected_ret_ids.clear()
            self.selected_plat_ids.clear()
            self.ret_pending_map.clear()
            self.plat_pending_map.clear()
            self.limpiar_trees()
            self.actualizar_estadisticas()
            messagebox.showinfo("OK", "Base de datos limpiada")
    
    def limpiar_trees(self):
        for item in self.tree_ret.get_children():
            self.tree_ret.delete(item)
        for item in self.tree_plat.get_children():
            self.tree_plat.delete(item)
        for item in self.tree_staging.get_children():
            self.tree_staging.delete(item)
    
    def carga_manual(self):
        top = tk.Toplevel(self.root)
        top.title("Carga Manual")
        top.geometry("400x300")
        top.configure(bg=self.colors['bg'])
        
        tk.Label(top, text="CARGA MANUAL", font=("Segoe UI", 12, "bold"),
                bg=self.colors['bg'], fg=self.colors['fg']).pack(pady=10)
        
        frame = tk.Frame(top, bg=self.colors['bg'], padx=20, pady=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(frame, text="Fuente:", bg=self.colors['bg'], fg=self.colors['fg']).grid(row=0, column=0, sticky='w', pady=5)
        combo_fuente = ttk.Combobox(frame, values=["RETIENCION", "PLATAFORMA"], state="readonly")
        combo_fuente.grid(row=0, column=1, sticky='ew', pady=5)
        combo_fuente.current(0)
        
        tk.Label(frame, text="CUIT:", bg=self.colors['bg'], fg=self.colors['fg']).grid(row=1, column=0, sticky='w', pady=5)
        entry_cuit = tk.Entry(frame)
        entry_cuit.grid(row=1, column=1, sticky='ew', pady=5)
        
        tk.Label(frame, text="Monto:", bg=self.colors['bg'], fg=self.colors['fg']).grid(row=2, column=0, sticky='w', pady=5)
        entry_monto = tk.Entry(frame)
        entry_monto.grid(row=2, column=1, sticky='ew', pady=5)
        
        tk.Label(frame, text="Período:", bg=self.colors['bg'], fg=self.colors['fg']).grid(row=3, column=0, sticky='w', pady=5)
        entry_periodo = tk.Entry(frame)
        entry_periodo.grid(row=3, column=1, sticky='ew', pady=5)
        
        tk.Label(frame, text="Razón Social:", bg=self.colors['bg'], fg=self.colors['fg']).grid(row=4, column=0, sticky='w', pady=5)
        entry_razon = tk.Entry(frame)
        entry_razon.grid(row=4, column=1, sticky='ew', pady=5)
        
        def guardar():
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                c.execute('''INSERT INTO ingresos 
                    (fuente, cuit, monto, periodo, razon_social, fecha_insert, archivo_origen)
                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                    (combo_fuente.get(), entry_cuit.get(), float(entry_monto.get()),
                     entry_periodo.get(), entry_razon.get(), fecha, "MANUAL"))
                conn.commit()
                conn.close()
                messagebox.showinfo("OK", "Registro guardado")
                top.destroy()
                self.actualizar_estadisticas()
            except Exception as e:
                messagebox.showerror("Error", str(e))
        
        btn_frame = tk.Frame(top, pady=15, bg=self.colors['bg'])
        btn_frame.pack(fill=tk.X)
        
        tk.Button(btn_frame, text="Guardar", command=guardar,
                bg=self.colors['success'], fg="white", relief=tk.FLAT, 
                padx=20, pady=8).pack(side=tk.LEFT, padx=10)
        
        tk.Button(btn_frame, text="Cancelar", command=top.destroy,
                bg=self.colors['danger'], fg="white", relief=tk.FLAT, 
                padx=20, pady=8).pack(side=tk.LEFT, padx=10)
    
    def load_pending_from_bd(self):
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Clear trees
            for item in self.tree_ret.get_children():
                self.tree_ret.delete(item)
            for item in self.tree_plat.get_children():
                self.tree_plat.delete(item)
            self.ret_pending_map.clear()
            self.plat_pending_map.clear()
            
            # Load RETENCION pending
            ret = pd.read_sql("SELECT * FROM ingresos WHERE fuente='RETIENCION' AND conciliado=0", conn)
            for _, r in ret.iterrows():
                iid = self.tree_ret.insert('', tk.END, values=(
                    str(r.get('cuit', '')),
                    f"{float(r.get('monto', 0)):,.2f}",
                    str(r.get('periodo', ''))
                ))
                self.ret_pending_map[iid] = {
                    'id': int(r.get('id', 0)),
                    'cuit': str(r.get('cuit', '')),
                    'monto': float(r.get('monto', 0)),
                    'periodo': str(r.get('periodo', '')),
                    'razon': str(r.get('razon_social', '')),
                    'archivo': str(r.get('archivo_origen', ''))
                }
            
            # Load PLATAFORMA pending
            plat = pd.read_sql("SELECT * FROM ingresos WHERE fuente='PLATAFORMA' AND conciliado=0", conn)
            for _, p in plat.iterrows():
                iid = self.tree_plat.insert('', tk.END, values=(
                    str(p.get('cuit', '')),
                    f"{float(p.get('monto', 0)):,.2f}",
                    str(p.get('periodo', ''))
                ))
                self.plat_pending_map[iid] = {
                    'id': int(p.get('id', 0)),
                    'cuit': str(p.get('cuit', '')),
                    'monto': float(p.get('monto', 0)),
                    'periodo': str(p.get('periodo', '')),
                    'razon': str(p.get('razon_social', '')),
                    'archivo': str(p.get('archivo_origen', ''))
                }
            conn.close()
            self.actualizar_estadisticas()
            messagebox.showinfo("OK", f"Pendientes cargados: RET={len(self.ret_pending_map)}, PLAT={len(self.plat_pending_map)}")
        except Exception as e:
            messagebox.showerror("Error", f"Error cargando pendientes: {str(e)}")
    
    def toggle_bd_selection(self, side):
        if side == 'ret':
            tree = self.tree_ret
            selected_set = self.selected_ret_ids
            data_map = self.ret_pending_map
        else:
            tree = self.tree_plat
            selected_set = self.selected_plat_ids
            data_map = self.plat_pending_map
        
        item = tree.focus()
        if not item:
            return
        
        db_id = data_map.get(item, {}).get('id')
        if not db_id:
            return
        
        if db_id in selected_set:
            selected_set.remove(db_id)
            tree.item(item, tags=())
        else:
            selected_set.add(db_id)
            tree.item(item, tags=('SEL',))
        
        self.update_totals()
    
    def update_totals(self):
        ret_id_to_item = {v['id']: k for k, v in self.ret_pending_map.items()}
        plat_id_to_item = {v['id']: k for k, v in self.plat_pending_map.items()}
        
        sum_ret = sum(
            self.ret_pending_map[ret_id_to_item[db_id]]['monto']
            for db_id in self.selected_ret_ids
            if db_id in ret_id_to_item
        )
        sum_plat = sum(
            self.plat_pending_map[plat_id_to_item[db_id]]['monto']
            for db_id in self.selected_plat_ids
            if db_id in plat_id_to_item
        )
        
        diff = sum_ret - sum_plat
        
        self.lbl_sel_ret.config(text=f"RET: ${sum_ret:,.2f} ({len(self.selected_ret_ids)})")
        self.lbl_sel_plat.config(text=f"PLAT: ${sum_plat:,.2f} ({len(self.selected_plat_ids)})")
        
        if abs(diff) <= 0.01:
            self.lbl_diferencia.config(text=f"Dif: ${diff:,.2f} ✓", fg="#27ae60")
        else:
            self.lbl_diferencia.config(text=f"Dif: ${diff:,.2f}", fg="#ed4956")
    
    def generate_cartesian_staging(self):
        if not self.selected_ret_ids or not self.selected_plat_ids:
            messagebox.showwarning("Aviso", "Seleccione registros de AMBOS lados primero")
            return
        
        self.limpiar_staging()
        
        ret_by_id = {v['id']: v for v in self.ret_pending_map.values()}
        plat_by_id = {v['id']: v for v in self.plat_pending_map.values()}
        
        ret_item_by_dbid = {v['id']: k for k, v in self.ret_pending_map.items()}
        plat_item_by_dbid = {v['id']: k for k, v in self.plat_pending_map.items()}
        
        count = 0
        for ret_id in self.selected_ret_ids:
            for plat_id in self.selected_plat_ids:
                if ret_id in ret_by_id and plat_id in plat_by_id:
                    r = ret_by_id[ret_id]
                    p = plat_by_id[plat_id]
                    self.tree_staging.insert('', tk.END, values=(
                        ret_id, plat_id,
                        r['cuit'], p['cuit'],
                        f"{r['monto']:,.2f}", f"{p['monto']:,.2f}",
                        r['periodo'], p['periodo']
                    ))
                    count += 1
        
        deleted_ret = 0
        for db_id in list(self.selected_ret_ids):
            if db_id in ret_item_by_dbid:
                item_id = ret_item_by_dbid[db_id]
                try:
                    if self.tree_ret.exists(item_id):
                        self.tree_ret.delete(item_id)
                        deleted_ret += 1
                except:
                    pass
                if item_id in self.ret_pending_map:
                    del self.ret_pending_map[item_id]
        
        deleted_plat = 0
        for db_id in list(self.selected_plat_ids):
            if db_id in plat_item_by_dbid:
                item_id = plat_item_by_dbid[db_id]
                try:
                    if self.tree_plat.exists(item_id):
                        self.tree_plat.delete(item_id)
                        deleted_plat += 1
                except:
                    pass
                if item_id in self.plat_pending_map:
                    del self.plat_pending_map[item_id]
        
        self.selected_ret_ids.clear()
        self.selected_plat_ids.clear()
        self.update_totals()
        self.actualizar_estadisticas()
        
        messagebox.showinfo("OK", f"Staging generado: {count} cruces.\n"
                          f"Eliminados: {deleted_ret} RET, {deleted_plat} PLAT.")
    
    def limpiar_staging(self):
        for item in self.tree_staging.get_children():
            self.tree_staging.delete(item)
    
    def confirmar_estaged(self):
        items = self.tree_staging.get_children()
        if not items:
            messagebox.showwarning("Aviso", "No hay cruces staged para confirmar")
            return
        
        if not messagebox.askyesno("Confirmar", f"¿Confirmar {len(items)} cruces staged?"):
            return
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        archivo = os.path.basename(self.archivo_actual) if self.archivo_actual else "unknown"
        
        confirmados = 0
        for item in items:
            vals = self.tree_staging.item(item, 'values')
            ret_id = int(vals[0])
            plat_id = int(vals[1])
            cuit_ret = vals[2]
            cuit_plat = vals[3]
            monto_ret = float(vals[4].replace(',', ''))
            monto_plat = float(vals[5].replace(',', ''))
            periodo_ret = vals[6]
            periodo_plat = vals[7]
            
            c.execute('''INSERT INTO cruces_ok 
                (id_retencion, id_plataforma, cuit, monto, periodo_ret, periodo_plat,
                 razon_social_ret, razon_social_plat, fecha_conciliado, archivo_origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (ret_id, plat_id, cuit_ret, monto_ret, periodo_ret, periodo_plat, 
                 '', '', fecha, archivo))
            
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, ret_id))
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, plat_id))
            confirmados += 1
        
        conn.commit()
        conn.close()
        
        self.limpiar_staging()
        self.selected_ret_ids.clear()
        self.selected_plat_ids.clear()
        self.load_pending_from_bd()
        self.actualizar_estadisticas()
        
        messagebox.showinfo("OK", f"{confirmados} cruces confirmados y guardados")
    
    def auto_match(self):
        if not self.ret_pending_map or not self.plat_pending_map:
            messagebox.showwarning("Aviso", "Primero cargue los pendientes desde BD")
            return
        
        self.limpiar_staging()
        
        ret_by_cuit = {}
        for item_id, data in self.ret_pending_map.items():
            cuit = data['cuit']
            if cuit not in ret_by_cuit:
                ret_by_cuit[cuit] = []
            ret_by_cuit[cuit].append({'item_id': item_id, **data})
        
        plat_by_cuit = {}
        for item_id, data in self.plat_pending_map.items():
            cuit = data['cuit']
            if cuit not in plat_by_cuit:
                plat_by_cuit[cuit] = []
            plat_by_cuit[cuit].append({'item_id': item_id, **data})
        
        ret_matched_ids = set()
        plat_matched_ids = set()
        matches = []
        
        for cuit in ret_by_cuit:
            if cuit in plat_by_cuit:
                for ret_item in ret_by_cuit[cuit]:
                    if ret_item['id'] in ret_matched_ids:
                        continue
                    for plat_item in plat_by_cuit[cuit]:
                        if plat_item['id'] in plat_matched_ids:
                            continue
                        if abs(ret_item['monto'] - plat_item['monto']) <= 0.01:
                            matches.append({
                                'ret_id': ret_item['id'],
                                'plat_id': plat_item['id'],
                                'cuit': cuit,
                                'monto_ret': ret_item['monto'],
                                'monto_plat': plat_item['monto'],
                                'periodo_ret': ret_item['periodo'],
                                'periodo_plat': plat_item['periodo']
                            })
                            ret_matched_ids.add(ret_item['id'])
                            plat_matched_ids.add(plat_item['id'])
                            break
        
        for match in matches:
            self.tree_staging.insert('', tk.END, values=(
                match['ret_id'], match['plat_id'],
                match['cuit'], match['cuit'],
                f"{match['monto_ret']:,.2f}", f"{match['monto_plat']:,.2f}",
                match['periodo_ret'], match['periodo_plat']
            ))
        
        for item_id, data in list(self.ret_pending_map.items()):
            if data['id'] in ret_matched_ids:
                self.tree_ret.delete(item_id)
                del self.ret_pending_map[item_id]
        
        for item_id, data in list(self.plat_pending_map.items()):
            if data['id'] in plat_matched_ids:
                self.tree_plat.delete(item_id)
                del self.plat_pending_map[item_id]
        
        self.selected_ret_ids.clear()
        self.selected_plat_ids.clear()
        self.actualizar_estadisticas()
        
        messagebox.showinfo("Auto-Match", f"Se encontraron {len(matches)} coincidencias automáticas.\n"
                          f"Quedan {len(self.ret_pending_map)} RET y {len(self.plat_pending_map)} PLAT pendientes.")

if __name__ == "__main__":
    CruceApp()
