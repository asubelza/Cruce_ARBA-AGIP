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
        self.root.geometry("1250x750")
        
        self.db_path = "cruce_data.db"
        self.init_db()
        
        self.archivo_actual = None
        self.dark_mode = False
        self.ok_este_cruce = []
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
        self.colors = {
            'bg': '#f5f5f5', 'fg': '#333', 'header_bg': '#2c3e50',
            'card_bg': '#fff', 'success': '#27ae60', 'warning': '#f39c12',
            'danger': '#e74c3c', 'primary': '#3498db'
        }
        
        self.root.configure(bg=self.colors['bg'])
        
        header = tk.Frame(self.root, bg=self.colors['header_bg'], height=50)
        header.pack(fill=tk.X)
        
        tk.Label(header, text="CRUCE ARBA - AGIP", font=("Segoe UI", 14, "bold"),
                bg=self.colors['header_bg'], fg='white').pack(side=tk.LEFT, padx=20)
        
        self.btn_theme = tk.Button(header, text="Oscuro", command=self.toggle_theme,
                bg='#34495e', fg='white', relief=tk.FLAT, padx=10)
        self.btn_theme.pack(side=tk.RIGHT, padx=20)
        
        main = tk.Frame(self.root, bg=self.colors['bg'], padx=15, pady=15)
        main.pack(fill=tk.BOTH, expand=True)
        
        file_frame = tk.LabelFrame(main, text="Seleccionar Archivo", bg=self.colors['card_bg'],
                fg='#2c3e50', font=("Segoe UI", 10, "bold"), padx=10, pady=10)
        file_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.entry = tk.Entry(file_frame, font=("Segoe UI", 10))
        self.entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        tk.Button(file_frame, text="Examinar", command=self.seleccionar_archivo,
                bg=self.colors['primary'], fg='white', relief=tk.FLAT).pack(side=tk.LEFT, padx=5)
        
        tk.Button(file_frame, text="Cargar", command=self.cargar_datos,
                bg=self.colors['success'], fg='white', relief=tk.FLAT,
                font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        # Stats con más detalle
        stats_frame = tk.LabelFrame(main, text="Estadísticas", bg=self.colors['card_bg'],
                fg='#2c3e50', font=("Segoe UI", 10, "bold"), padx=15, pady=10)
        stats_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.lbl_stats = []
        labels = [
            ("Pend. RETENCION:", "warning"),
            ("Pend. PLATAFORMA:", "warning"),
            ("Pend. Totales:", "warning"),
            ("OK Este Cruce:", "success"),
            ("OK Históricos:", "primary"),
        ]
        
        for i, (text, color) in enumerate(labels):
            lbl = tk.Label(stats_frame, text=text + " 0", font=("Segoe UI", 10),
                bg=self.colors['card_bg'], fg=self.colors[color])
            lbl.pack(side=tk.LEFT, padx=15)
            self.lbl_stats.append(lbl)
        
        preview_frame = tk.LabelFrame(main, text="Vista Previa", bg=self.colors['card_bg'],
                fg='#2c3e50', font=("Segoe UI", 10, "bold"), padx=10, pady=5)
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        cols = ("CUIT", "Monto RET", "Período", "Monto PLAT", "Estado")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show="headings", height=12)
        
        self.tree.heading("CUIT", text="CUIT")
        self.tree.heading("Monto RET", text="Monto RET")
        self.tree.heading("Período", text="Período")
        self.tree.heading("Monto PLAT", text="Monto PLAT")
        self.tree.heading("Estado", text="Estado")
        
        self.tree.column("CUIT", width=130)
        self.tree.column("Monto RET", width=110)
        self.tree.column("Período", width=100)
        self.tree.column("Monto PLAT", width=110)
        self.tree.column("Estado", width=100)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tk.Scrollbar(preview_frame, command=self.tree.yview).pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.configure(yscrollcommand=lambda f, l: self.tree.yview(f, l))
        
        self.tree.tag_configure("OK", background="#d5f4e6")
        self.tree.tag_configure("PENDIENTE", background="#fef9e7")
        self.tree.tag_configure("VALIDADO", background="#d4edda")
        self.tree.tag_configure("NO_VALIDADO", background="#f8d7da")
        
        self.tree.bind("<Double-Button-1>", self.toggle_validacion)
        
        btn_frame = tk.Frame(main, bg=self.colors['bg'])
        btn_frame.pack(fill=tk.X, pady=5)
        
        tk.Label(btn_frame, text="Doble clic en fila para validar/invalidar", 
                bg=self.colors['bg'], fg='#666', font=("Segoe UI", 9)).pack(side=tk.LEFT, padx=10)
        
        for text, cmd, color in [
            ("Confirmar Validados", self.confirmar, self.colors['success']),
            ("Exportar Este Cruce", self.exportar_este, self.colors['primary']),
            ("Exportar Históricos", self.exportar_historicos, self.colors['primary']),
            ("Ver Pendientes", self.ver_pendientes, self.colors['warning']),
            ("Limpiar BD", self.limpiar_bd, self.colors['danger'])
        ]:
            tk.Button(btn_frame, text=text, command=cmd, bg=color, fg='white',
                    relief=tk.FLAT, padx=10, pady=5).pack(side=tk.LEFT, padx=3)
    
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
        
        self.lbl_stats[0].config(text=f"Pend. RETENCION: {pend_ret}")
        self.lbl_stats[1].config(text=f"Pend. PLATAFORMA: {pend_plat}")
        self.lbl_stats[2].config(text=f"Pend. Totales: {pend_total}")
        self.lbl_stats[3].config(text=f"OK Este Cruce: {len(self.ok_este_cruce)}")
        self.lbl_stats[4].config(text=f"OK Históricos: {ok_historicos}")
    
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
            
            self.mostrar_preview()
            
        except Exception as e:
            messagebox.showerror("Error", str(e))
    
    def mostrar_preview(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        conn = sqlite3.connect(self.db_path)
        ret = pd.read_sql("SELECT * FROM ingresos WHERE fuente='RETIENCION' AND conciliado=0", conn)
        plat = pd.read_sql("SELECT * FROM ingresos WHERE fuente='PLATAFORMA' AND conciliado=0", conn)
        
        ok = 0
        matched_ret = set()
        matched_plat = set()
        
        self.ok_este_cruce = []
        self.ok_seleccionados = []
        
        for _, r in ret.iterrows():
            m = plat[(plat['cuit'] == r['cuit']) & (abs(plat['monto'] - r['monto']) < 0.01)]
            if not m.empty:
                p = m.iloc[0]
                id_plat = int(p['id'])
                id_ret = int(r['id'])
                
                ok += 1
                matched_ret.add(id_ret)
                matched_plat.add(id_plat)
                
                item_data = {
                    'id_ret': id_ret, 'id_plat': id_plat,
                    'cuit': r['cuit'], 'monto': r['monto'],
                    'periodo_ret': r['periodo'], 'periodo_plat': p['periodo'],
                    'razon_ret': str(r.get('razon_social', '')), 'razon_plat': str(p.get('razon_social', '')),
                    'archivo_ret': r.get('archivo_origen', ''), 'archivo_plat': p.get('archivo_origen', '')
                }
                self.ok_este_cruce.append(item_data)
                self.ok_seleccionados.append(item_data)
                
                self.tree.insert('', tk.END, values=(
                    r['cuit'],
                    f"{r['monto']:,.2f}",
                    r['periodo'],
                    f"{p['monto']:,.2f}",
                    "✓ OK"
                ), tags=("VALIDADO",))
        
        for _, r in ret.iterrows():
            if r['id'] not in matched_ret:
                self.tree.insert('', tk.END, values=(
                    r['cuit'],
                    f"{r['monto']:,.2f}",
                    r['periodo'],
                    "—",
                    "PENDIENTE"
                ), tags=("PENDIENTE",))
        
        for _, p in plat.iterrows():
            if p['id'] not in matched_plat:
                self.tree.insert('', tk.END, values=(
                    p['cuit'],
                    "—",
                    p['periodo'],
                    f"{p['monto']:,.2f}",
                    "PENDIENTE"
                ), tags=("PENDIENTE",))
        
        conn.close()
        self.actualizar_estadisticas()
        
        if ok > 0:
            messagebox.showinfo("Cruces Detectados", 
                f"Se encontraron {ok} coincidencias.\n\n"
                f"Doble clic en fila para quitar del cruce.")
        else:
            messagebox.showinfo("Sin Cruces", "No se encontraron coincidencias.")
    
    def mostrar_ventana_cruces(self):
        top = tk.Toplevel(self.root)
        top.title("Conciliación de Cruces")
        top.geometry("1100x600")
        
        header = tk.Frame(top, bg="#2c3e50", height=40)
        header.pack(fill=tk.X)
        tk.Label(header, text="VERIFICACIÓN DE CRUCES", font=("Segoe UI", 12, "bold"),
                bg="#2c3e50", fg="white").pack(pady=8)
        
        tk.Label(top, text="Doble clic en fila para validar/invalidar | Verde = OK, Rojo = Quitar",
                fg="#666", font=("Segoe UI", 9)).pack(pady=5)
        
        paned = tk.PanedWindow(top, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        frame_ret = tk.Frame(paned)
        frame_plat = tk.Frame(paned)
        
        tk.Label(frame_ret, text="📄 RETENCION", font=("Segoe UI", 11, "bold"),
                bg="#3498db", fg="white", pady=5).pack(fill=tk.X)
        tk.Label(frame_plat, text="📄 PLATAFORMA", font=("Segoe UI", 11, "bold"),
                bg="#27ae60", fg="white", pady=5).pack(fill=tk.X)
        
        cols = ("CUIT", "Monto", "Período", "R.Soc")
        tree_ret = ttk.Treeview(frame_ret, columns=cols, show="headings", height=18)
        tree_plat = ttk.Treeview(frame_plat, columns=cols, show="headings", height=18)
        
        for col in cols:
            tree_ret.heading(col, text=col)
            tree_ret.column(col, width=130 if col != "R.Soc" else 150)
            tree_plat.heading(col, text=col)
            tree_plat.column(col, width=130 if col != "R.Soc" else 150)
        
        tree_ret.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(5,2), pady=5)
        tree_plat.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(2,5), pady=5)
        
        tree_ret.tag_configure("VALIDADO", background="#d4edda")
        tree_ret.tag_configure("NO_VALIDADO", background="#f8d7da")
        
        item_map = {}
        
        for item_data in self.ok_este_cruce:
            item_ret = tree_ret.insert('', tk.END, values=(
                item_data['cuit'],
                f"{item_data['monto']:,.2f}",
                item_data['periodo_ret'],
                item_data['razon_ret'][:25] if item_data['razon_ret'] else ''
            ), tags=("VALIDADO",))
            
            item_plat = tree_plat.insert('', tk.END, values=(
                item_data['cuit'],
                f"{item_data['monto']:,.2f}",
                item_data['periodo_plat'],
                item_data['razon_plat'][:25] if item_data['razon_plat'] else ''
            ), tags=("VALIDADO",))
            
            item_map[item_ret] = {'item_plat': item_plat, 'data': item_data}
        
        def on_double_click(event):
            tree = event.widget
            item_id = tree.focus()
            if not item_id or item_id not in item_map:
                return
            
            current_tags = tree.item(item_id, "tags")
            
            if "VALIDADO" in current_tags:
                tree.item(item_id, tags=("NO_VALIDADO",))
                other_tree = tree_plat if tree == tree_ret else tree_ret
                other_item = item_map[item_id]['item_plat']
                other_tree.item(other_item, tags=("NO_VALIDADO",))
                
                if item_map[item_id]['data'] in self.ok_seleccionados:
                    self.ok_seleccionados.remove(item_map[item_id]['data'])
            else:
                tree.item(item_id, tags=("VALIDADO",))
                other_tree = tree_plat if tree == tree_ret else tree_ret
                other_item = item_map[item_id]['item_plat']
                other_tree.item(other_item, tags=("VALIDADO",))
                
                if item_map[item_id]['data'] not in self.ok_seleccionados:
                    self.ok_seleccionados.append(item_map[item_id]['data'])
            
            self.actualizar_estadisticas()
        
        tree_ret.bind("<Double-Button-1>", on_double_click)
        tree_plat.bind("<Double-Button-1>", on_double_click)
        
        scroll_ret = ttk.Scrollbar(frame_ret, orient=tk.VERTICAL, command=tree_ret.yview)
        scroll_ret.pack(side=tk.RIGHT, fill=tk.Y)
        tree_ret.configure(yscrollcommand=scroll_ret.set)
        
        scroll_plat = ttk.Scrollbar(frame_plat, orient=tk.VERTICAL, command=tree_plat.yview)
        scroll_plat.pack(side=tk.RIGHT, fill=tk.Y)
        tree_plat.configure(yscrollcommand=scroll_plat.set)
        
        paned.add(frame_ret, minsize=450)
        paned.add(frame_plat, minsize=450)
        
        btn_frame = tk.Frame(top, pady=10)
        btn_frame.pack(fill=tk.X)
        
        tk.Button(btn_frame, text="✓ Confirmar Validados", command=lambda: self.confirmar_desde_ventana(top),
                bg="#27ae60", fg="white", relief=tk.FLAT, padx=20, pady=8,
                font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT, padx=10)
        
        tk.Button(btn_frame, text="✗ Cancelar", command=top.destroy,
                bg="#e74c3c", fg="white", relief=tk.FLAT, padx=20, pady=8).pack(side=tk.LEFT, padx=10)
        
        self.ventana_cruces = top
        self.tree_ret = tree_ret
        self.tree_plat = tree_plat
        self.item_map = item_map
    
    def confirmar_desde_ventana(self, ventana):
        if not self.ok_seleccionados:
            messagebox.showinfo("Info", "No hay cruces validados para confirmar")
            return
        
        if not messagebox.askyesno("Confirmar", f"¿Confirmar {len(self.ok_seleccionados)} cruces validados?"):
            return
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        archivo = os.path.basename(self.archivo_actual) if self.archivo_actual else "unknown"
        
        for item in self.ok_seleccionados:
            c.execute('''INSERT INTO cruces_ok 
                (id_retencion, id_plataforma, cuit, monto, periodo_ret, periodo_plat,
                 razon_social_ret, razon_social_plat, fecha_conciliado, archivo_origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (item['id_ret'], item['id_plat'], item['cuit'], item['monto'],
                 item['periodo_ret'], item['periodo_plat'], item['razon_ret'],
                 item['razon_plat'], fecha, archivo))
            
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, item['id_ret']))
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, item['id_plat']))
        
        conn.commit()
        conn.close()
        
        ventana.destroy()
        self.ok_este_cruce = []
        self.ok_seleccionados = []
        self.mostrar_preview()
        self.actualizar_estadisticas()
        messagebox.showinfo("Confirmado", "Cruces guardados en histórico")
    
    def toggle_validacion(self, event):
        item_id = self.tree.focus()
        if not item_id:
            return
        
        current_tags = self.tree.item(item_id, "tags")
        current_vals = self.tree.item(item_id, "values")
        
        if "VALIDADO" in current_tags:
            self.tree.item(item_id, tags=("NO_VALIDADO",))
            self.tree.item(item_id, values=(current_vals[0], current_vals[1], "✗ QUITAR", current_vals[3]))
            for item in self.ok_este_cruce:
                if item['item_id'] == item_id:
                    if item in self.ok_seleccionados:
                        self.ok_seleccionados.remove(item)
                    break
        else:
            self.tree.item(item_id, tags=("VALIDADO",))
            self.tree.item(item_id, values=(current_vals[0], current_vals[1], "✓ VALIDADO", current_vals[3]))
            for item in self.ok_este_cruce:
                if item['item_id'] == item_id:
                    if item not in self.ok_seleccionados:
                        self.ok_seleccionados.append(item)
                    break
        
        self.actualizar_estadisticas()
    
    def confirmar(self):
        if not self.ok_seleccionados:
            messagebox.showinfo("Info", "No hay cruces validados para confirmar")
            return
        
        if not messagebox.askyesno("Confirmar", f"¿Confirmar {len(self.ok_seleccionados)} cruces validados?"):
            return
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        archivo = os.path.basename(self.archivo_actual) if self.archivo_actual else "unknown"
        
        for item in self.ok_seleccionados:
            c.execute('''INSERT INTO cruces_ok 
                (id_retencion, id_plataforma, cuit, monto, periodo_ret, periodo_plat,
                 razon_social_ret, razon_social_plat, fecha_conciliado, archivo_origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (item['id_ret'], item['id_plat'], item['cuit'], item['monto'],
                 item['periodo_ret'], item['periodo_plat'], item['razon_ret'],
                 item['razon_plat'], fecha, archivo))
            
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, item['id_ret']))
            c.execute("UPDATE ingresos SET conciliado=1, fecha_conciliado=? WHERE id=?", (fecha, item['id_plat']))
        
        conn.commit()
        conn.close()
        
        self.ok_este_cruce = []
        self.ok_seleccionados = []
        self.mostrar_preview()
        self.actualizar_estadisticas()
        messagebox.showinfo("Confirmado", "Cruces guardados en histórico")
    
    def exportar_este(self):
        if not self.ok_este_cruce:
            messagebox.showinfo("Info", "No hay cruces este cruce para exportar")
            return
        
        data = []
        for item in self.ok_este_cruce:
            data.append({
                'CUIT': item['cuit'],
                'Monto': item['monto'],
                'Período RETENCION': item['periodo_ret'],
                'Período PLATAFORMA': item['periodo_plat'],
                'Razón Social RET': item['razon_ret'],
                'Razón Social PLAT': item['razon_plat'],
                'Fecha': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        
        df = pd.DataFrame(data)
        
        f = filedialog.asksaveasfilename(defaultextension=".xlsx",
            initialfile=f"Cruce_Este_{datetime.now().strftime('%Y%m%d')}.xlsx")
        if f:
            df.to_excel(f, index=False)
            messagebox.showinfo("OK", f"Exportado a {f}")
    
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
            self.actualizar_estadisticas()
            for item in self.tree.get_children():
                self.tree.delete(item)
            messagebox.showinfo("OK", "Base de datos limpiada")

if __name__ == "__main__":
    CruceApp()
