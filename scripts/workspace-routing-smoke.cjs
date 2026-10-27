const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const {mockIdentity}=require('./auth-fixture.cjs');
const privateNames=['Mi dashboard','Mis solicitudes','Reservas','Auditorías','Documentos','Administración'];
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});try{
 for(const mode of ['guest','realm-admin','client-admin','member','old-client-admin']){
 const p=await b.newPage();await mockIdentity(p,mode);await p.goto('http://127.0.0.1:5173');await p.waitForFunction(()=>window.__oidcInit);
 assert.equal(await p.evaluate(()=>window.__oidcConfig.clientId),'clientid-web-react');
 if(['realm-admin','client-admin'].includes(mode)){
 await p.getByRole('heading',{name:'Bienvenido, Administradora Demo',exact:true}).waitFor();for(const name of privateNames)assert.equal(await p.locator('nav').getByRole('button',{name:new RegExp('^'+name)}).count(),1);assert.equal(await p.locator('nav').getByRole('button',{name:'Inicio',exact:true}).count(),0);assert.equal(await p.locator('nav').getByRole('button',{name:'Catálogo de servicios',exact:true}).count(),0);
 await p.locator('nav').getByRole('button',{name:'Administración',exact:true}).click();await p.getByRole('heading',{name:'Gestión de servicios',exact:true}).waitFor();await p.evaluate(()=>window.__removeRole());await p.getByText('Tu cuenta no tiene permisos administrativos',{exact:true}).waitFor();assert.equal(await p.locator('nav').getByRole('button',{name:'Administración',exact:true}).count(),0);
 }else if(mode!=='guest'){
 await p.getByText('Tu cuenta no tiene permisos administrativos',{exact:true}).waitFor();await p.getByText('Cómo habilitar el acceso administrativo',{exact:true}).click();assert.match(await p.locator('.access-role-help').innerText(),/clientid-web-react/);assert.match(await p.locator('.access-role-help').innerText(),/admin/);for(const name of privateNames)assert.equal(await p.locator('nav').getByRole('button',{name:new RegExp('^'+name)}).count(),0);
 }else{await p.getByRole('heading',{name:'Más confianza. Menos riesgos.',exact:true}).waitFor();await p.locator('nav').getByRole('button',{name:'Catálogo de servicios',exact:true}).click();assert.equal(await p.locator('.service-card').count(),6);assert.equal(await p.evaluate(()=>window.__loginOptions),undefined);}
 if(mode!=='guest'){await p.locator('.sidebar-auth').getByRole('button',{name:'Cerrar sesión',exact:true}).click();await p.getByRole('heading',{name:'Más confianza. Menos riesgos.',exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'Mi perfil',exact:true}).count(),0);await p.locator('nav').getByRole('button',{name:'Catálogo de servicios',exact:true}).click();assert.equal(await p.locator('.service-card').count(),6);}
 await p.close();
 }
 console.log('PASS: cliente clientid-web-react, visitantes públicos, entrada automática al dashboard para roles válidos, seis secciones, aviso sin rol, rechazo de rol del cliente anterior, revocación y salida al catálogo público. SDK simulado.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
