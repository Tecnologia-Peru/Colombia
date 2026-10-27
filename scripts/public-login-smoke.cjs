// Regression for involuntary public-page redirects: uses the real keycloak-js SDK.
// Only the remote identity-provider response is intercepted, after explicit login.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});try{
 for(const google of [false,true]){
 const page=await browser.newPage();const identityRequests=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://identity.example.test/**',route=>{identityRequests.push(route.request().url());return route.fulfill({contentType:'text/html',body:'<!doctype html><h1>Proveedor de prueba</h1>'});});
 await page.goto('http://127.0.0.1:5174/?campaign=public');await page.getByRole('heading',{name:'Más confianza. Menos riesgos.',exact:true}).waitFor();
 await page.locator('nav').getByRole('button',{name:'Catálogo de servicios',exact:true}).click();assert.equal(await page.locator('.service-card').count(),6);assert.equal(new URL(page.url()).origin,'http://127.0.0.1:5174');assert.equal(identityRequests.length,0);
 await page.reload();await page.getByRole('button',{name:'Acceso administrativo',exact:true}).click();await page.getByRole('button',{name:'Continuar con Google',exact:true}).waitFor();assert.equal(identityRequests.length,0);
 await page.getByRole('button',{name:google?'Continuar con Google':'Entrar con Keycloak',exact:google}).click();await page.getByRole('heading',{name:'Proveedor de prueba'}).waitFor();assert.equal(identityRequests.length,1);
 const destination=new URL(identityRequests[0]);assert.equal(destination.pathname,'/realms/ingenia/protocol/openid-connect/auth');assert.equal(destination.searchParams.get('redirect_uri'),'http://127.0.0.1:5174/');assert.equal(destination.searchParams.get('client_id'),'ingenia-web');assert.equal(destination.searchParams.get('response_type'),'code');assert.equal(destination.searchParams.get('code_challenge_method'),'S256');assert.equal(destination.searchParams.get('kc_idp_hint'),google?'google':null);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: SDK real sin redirección ni solicitudes al proveedor al abrir, navegar, recargar o ver acceso; redirección explícita para Keycloak/Google con retorno raíz y PKCE correctos.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
