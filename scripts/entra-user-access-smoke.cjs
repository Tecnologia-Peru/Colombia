const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');const {mockEntra}=require('./entra-fixture.cjs');const origin=process.env.TEST_URL||'http://127.0.0.1:5173';
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});try{
 for(const mode of ['listed-user','listed-foreign','listed-wrong-audience','same-email','member','admin','guest']){
 const p=await b.newPage();await mockEntra(p,mode);await p.goto(origin);
 if(['listed-user','admin'].includes(mode)){
  await p.getByRole('heading',{name:'Bienvenido, Administradora Demo',exact:true}).waitFor();for(const name of ['Mi dashboard','Mis solicitudes','Reservas','Auditorías','Documentos','Administración'])assert.equal(await p.locator('nav').getByRole('button',{name:new RegExp('^'+name)}).count(),1);await p.locator('nav').getByRole('button',{name:'Administración',exact:true}).click();await p.getByRole('heading',{name:'Gestión de servicios',exact:true}).waitFor();await p.locator('.sidebar-auth').getByRole('button',{name:'Cerrar sesión',exact:true}).click();await p.getByRole('heading',{name:'Más confianza. Menos riesgos.',exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'Mi perfil',exact:true}).count(),0);
 }else if(['listed-foreign','listed-wrong-audience'].includes(mode)){
  await p.getByRole('alert').waitFor();assert.equal(await p.getByRole('button',{name:'Mi perfil',exact:true}).count(),0);assert.equal(await p.locator('nav').getByRole('button',{name:'Administración',exact:true}).count(),0);
 }else if(mode==='guest'){
  await p.getByRole('heading',{name:'Más confianza. Menos riesgos.',exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.__entra.loginCalls),0);await p.locator('nav').getByRole('button',{name:'Catálogo de servicios',exact:true}).click();assert.equal(await p.locator('.service-card').count(),6);
 }else{
  await p.getByText('Tu cuenta no tiene permisos administrativos',{exact:true}).waitFor();assert.equal(await p.locator('nav').getByRole('button',{name:'Administración',exact:true}).count(),0);await p.getByText('Ver permisos de esta sesión',{exact:true}).click();assert.match(await p.locator('.permission-diagnostics').innerText(),mode==='same-email'?/99999999-9999-4999-8999-999999999999/:/No recibido/);
 }
 await p.close();
 }
 console.log('PASS: usuario oid autorizado sin rol, rol existente conservado, mismo oid de otro tenant o audiencia rechazado, otra cuenta con mismo email rechazada, sin oid denegado, logout y público sin autenticación. MSAL simulado.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
