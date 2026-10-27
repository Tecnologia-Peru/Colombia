import { Globe, ScanLine, ShieldCheck, Fingerprint, LockKeyhole, BookOpen } from 'lucide-react';
export const defaultServices = [
 {id:1,name:'Pentesting de aplicaciones web',category:'Seguridad ofensiva',description:'Descubre vulnerabilidades antes de que alguien más lo haga. Evaluamos tu aplicación con la metodología OWASP.',price:2800000,icon:Globe,color:'blue',tag:'Más solicitado',duration:'5–7 días hábiles',features:['Análisis OWASP Top 10','Pruebas manuales y automatizadas','Informe ejecutivo y técnico','Sesión de resultados y retest']},
 {id:2,name:'Auditoría de infraestructura',category:'Auditoría y cumplimiento',description:'Una visión completa de la seguridad de tu infraestructura, configuraciones y controles de acceso.',price:3500000,icon:ScanLine,color:'purple',tag:'Evaluación integral',duration:'7–10 días hábiles',features:['Inventario de activos','Revisión de configuraciones','Evaluación de controles','Plan de remediación priorizado']},
 {id:3,name:'Diagnóstico de ciberseguridad',category:'Consultoría',description:'Conoce tu nivel de madurez digital y construye una hoja de ruta para proteger lo que más importa.',price:1200000,icon:ShieldCheck,color:'green',tag:'Ideal para empezar',duration:'3–5 días hábiles',features:['Entrevista de diagnóstico','Evaluación de madurez','Mapa de riesgos','Hoja de ruta personalizada']},
 {id:4,name:'Gestión de identidad y accesos',category:'Protección y prevención',description:'Protege las identidades de tu organización con accesos seguros y el principio de mínimo privilegio.',price:2400000,icon:Fingerprint,color:'orange',tag:'Acceso seguro',duration:'5–8 días hábiles',features:['Revisión de permisos','Diseño de políticas IAM','Recomendaciones MFA','Guía de implementación']},
 {id:5,name:'Seguridad en la nube',category:'Protección y prevención',description:'Identifica riesgos en AWS, Azure o Google Cloud y mejora la postura de seguridad de tu nube.',price:3200000,icon:LockKeyhole,color:'blue',tag:'Cloud security',duration:'5–7 días hábiles',features:['Evaluación de configuración','Revisión de exposición','Análisis de permisos','Informe de mejoras']},
 {id:6,name:'Capacitación para equipos',category:'Consultoría',description:'Convierte a tus colaboradores en la primera línea de defensa con talleres prácticos de seguridad.',price:950000,icon:BookOpen,color:'purple',tag:'Para tu equipo',duration:'1–2 días hábiles',features:['Taller de concientización','Ejercicios de phishing','Material de consulta','Evaluación de aprendizaje']}
];
export type Service = typeof defaultServices[number];

export const categories = ['Seguridad ofensiva','Auditoría y cumplimiento','Consultoría','Protección y prevención'];
const storageKey = 'clarity.catalog.v1';
const textFields = ['name','category','description','tag','duration'] as const;
// Import only editable data. Icons and styling always come from the trusted defaults.
export function parseCatalog(value: unknown): Service[] {
 if (!Array.isArray(value) || value.length !== defaultServices.length) throw new Error('El archivo debe contener los seis servicios del catálogo.');
 const ids = new Set<number>();
 const result = value.map(item => {
  if (!item || typeof item !== 'object') throw new Error('Servicio no válido.');
  const base = defaultServices.find(s => s.id === item.id);
  if (!base || ids.has(item.id)) throw new Error('Los identificadores de los servicios no son válidos o están duplicados.');
  ids.add(item.id);
  for (const field of textFields) {
   if (typeof item[field] !== 'string' || !item[field].trim() || item[field].length > (field === 'description' ? 1500 : 150)) throw new Error('Completa los textos y respeta sus límites de longitud.');
  }
  if (!categories.includes(item.category)) throw new Error('La categoría no es válida.');
  if (!Number.isSafeInteger(item.price) || item.price < 0 || item.price > 1000000000) throw new Error('El precio debe ser un número entero entre 0 y 1.000.000.000 COP.');
  if (!Array.isArray(item.features) || item.features.length < 1 || item.features.length > 12 || item.features.some((f: unknown) => typeof f !== 'string' || !f.trim() || f.length > 200)) throw new Error('Añade entre 1 y 12 entregables de hasta 200 caracteres.');
  return {...base,...Object.fromEntries(textFields.map(f=>[f,item[f].trim()])),price:item.price,features:item.features.map((f:string)=>f.trim())} as Service;
 });
 return defaultServices.map(base=>result.find(s=>s.id===base.id)!);
}
export function loadCatalog(): {services: Service[]; error: string} {
 try {
  const saved=localStorage.getItem(storageKey);
  return {services:saved?parseCatalog(JSON.parse(saved)):defaultServices,error:''};
 } catch {
  return {services:defaultServices,error:'No se pudo recuperar el catálogo local. Mostramos los servicios originales; importa una copia o guarda una nueva versión.'};
 }
}
export function exportableCatalog(services: Service[]) {
 return services.map(({id,name,category,description,price,tag,duration,features})=>({id,name,category,description,price,tag,duration,features}));
}
export function persistCatalog(services: Service[]) {
 const validated=parseCatalog(services);
 try {localStorage.setItem(storageKey,JSON.stringify(exportableCatalog(validated)));}
 catch {throw new Error('No se pudieron guardar los cambios. Comprueba que el navegador permite almacenamiento local y dispone de espacio.');}
}
