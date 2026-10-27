import { useState, useRef } from 'react';
import { Save, Pencil, Download, Upload, RotateCcw, CheckCircle2, Info, Eye, X } from 'lucide-react';
import { categories, defaultServices, exportableCatalog, parseCatalog, type Service } from '../catalog';

type Props={services:Service[];onSave:(services:Service[])=>void;initialError:string};
const money=(n:number)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
export function AdminPanel({services,onSave,initialError}:Props){
 const [editing,setEditing]=useState<Service|null>(null);
 const [features,setFeatures]=useState('');
 const [message,setMessage]=useState('');
 const [error,setError]=useState(initialError);
 const [reset,setReset]=useState(false);
 const [pendingImport,setPendingImport]=useState<Service[]|null>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 function commit(next:Service[],success:string){
  try{onSave(next);setMessage(success);setError('');return true;}
  catch(e){setError(e instanceof Error?e.message:'No se pudo guardar el catálogo.');setMessage('');return false;}
 }
 function edit(s:Service){setEditing({...s});setFeatures(s.features.join('\n'));setError('');setMessage('');}
 function exportFile(){const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,services:exportableCatalog(services)},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='clarity-catalogo.json';a.click();URL.revokeObjectURL(url);}
 async function importFile(file:File){
  try{if(file.size>100000)throw new Error('El archivo supera el límite de 100 KB.');const data=JSON.parse(await file.text());if(data.version!==1)throw new Error('Versión de archivo no compatible.');setPendingImport(parseCatalog(data.services));setError('');setMessage('');}
  catch(e){setError(e instanceof Error?e.message:'No se pudo leer el archivo.');}
 }
 return <section className="admin-section">
  <div className="admin-info"><Info size={20}/><div><strong>Tu catálogo, a tu manera</strong><p>Edita el contenido sin tocar código. Los cambios se aplican al catálogo, al detalle y al carrito de este navegador. No se publican para otros visitantes ni se guardan en GitHub.</p><small>Editor de demostración sin autenticación. Exporta una copia antes de cambiar de navegador o dirección del Codespace, o borrar sus datos.</small></div></div>
  <div className="panel"><div className="section-heading admin-toolbar"><div><h2>Gestión de servicios</h2><p>{services.length} servicios · Precios en pesos colombianos</p></div><div className="admin-actions"><button className="button secondary" onClick={exportFile}><Download size={15}/>Exportar copia</button><button className="button secondary" onClick={()=>fileInput.current?.click()}><Upload size={15}/>Importar copia</button><input ref={fileInput} className="admin-file" type="file" accept=".json,application/json" aria-label="Importar catálogo JSON" onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);e.target.value='';}}/></div></div>
  {message&&<div className="admin-feedback success" role="status"><CheckCircle2 size={17}/>{message}</div>}
  {error&&<div className="admin-feedback error" role="alert">{error}</div>}
  <div className="admin-list">{services.map(s=><article className="admin-service" key={s.id}><span className={`service-icon ${s.color}`}><s.icon size={23}/></span><div className="admin-service-info"><small>{s.category}</small><h3>{s.name}</h3><p>{s.duration} · {s.tag}</p></div><strong className="admin-price">{money(s.price)}<small>COP · Desde</small></strong><button className="button secondary" onClick={()=>edit(s)} aria-label={`Editar ${s.name}`}><Pencil size={15}/>Editar</button></article>)}</div>
  <div className="admin-bottom"><span><Eye size={16}/> Los cambios guardados aparecen inmediatamente en el catálogo.</span><button className="text-link" onClick={()=>setReset(true)}><RotateCcw size={14}/>Restaurar originales</button></div></div>
  {editing&&<div className="modal-backdrop"><section className="modal admin-modal" role="dialog" aria-modal="true" aria-label="Editar servicio"><button className="close icon-button" aria-label="Cerrar editor" onClick={()=>setEditing(null)}><X/></button><span className="eyebrow">ADMINISTRACIÓN · CATÁLOGO</span><h2>Editar servicio</h2><p className="muted">Ajusta el contenido y guarda cuando esté listo.</p><form onSubmit={e=>{e.preventDefault();const next={...editing,features:features.split('\n').map(f=>f.trim()).filter(Boolean)};if(commit(services.map(s=>s.id===next.id?next:s),'Servicio actualizado y guardado en este navegador.'))setEditing(null);}}>
  <label>Nombre del servicio<input required maxLength={150} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label>
  <label>Categoría<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
  <label>Descripción<textarea required maxLength={1500} rows={4} value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label>
  <div className="form-grid"><label>Precio desde (COP)<input type="number" required min={0} max={1000000000} step={1} value={Number.isNaN(editing.price)?'':editing.price} onChange={e=>setEditing({...editing,price:e.target.value===''?NaN:Number(e.target.value)})}/></label><label>Tiempo de entrega<input required maxLength={150} value={editing.duration} onChange={e=>setEditing({...editing,duration:e.target.value})}/></label></div>
  <label>Etiqueta de la tarjeta<input required maxLength={150} value={editing.tag} onChange={e=>setEditing({...editing,tag:e.target.value})}/></label>
  <label>Entregables (uno por línea)<textarea required rows={4} value={features} onChange={e=>setFeatures(e.target.value)}/><small className="muted">Entre 1 y 12 entregables, de hasta 200 caracteres cada uno.</small></label>
  {error&&<div className="admin-feedback error" role="alert">{error}</div>}
  <div className="admin-form-actions"><button type="button" className="button secondary" onClick={()=>setEditing(null)}>Cancelar</button><button className="button primary" type="submit"><Save size={16}/>Guardar cambios</button></div></form></section></div>}
  {(reset||pendingImport)&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="Confirmar reemplazo del catálogo"><h2>{reset?'¿Restaurar el catálogo original?':'¿Importar este catálogo?'}</h2><p className="muted">Esta acción reemplazará los seis servicios guardados en este navegador. Exporta una copia si quieres conservar la versión actual.</p><div className="admin-form-actions"><button className="button secondary" onClick={()=>{setReset(false);setPendingImport(null);}}>Cancelar</button><button className="button primary" onClick={()=>{if(commit(reset?defaultServices:pendingImport!,reset?'Catálogo original restaurado.':'Copia importada y guardada en este navegador.')){setReset(false);setPendingImport(null);}}}>Confirmar reemplazo</button></div>{error&&<div className="admin-feedback error" role="alert">{error}</div>}</section></div>}
 </section>;
}
