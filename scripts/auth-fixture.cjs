// Browser-only SDK double. Never imported by application code or production builds.
async function mockIdentity(page, mode = 'realm-admin') {
 await page.route(/\/node_modules\/\.vite\/deps\/keycloak-js\.js(?:\?|$)/, route => route.fulfill({
  contentType: 'application/javascript',
  body: `const mode=${JSON.stringify(mode)};
  export default class TestKeycloak {
   authenticated=false; tokenParsed={name:'Administradora Demo',email:'admin@example.com'};
   constructor(config){this.config=config;}
   async init(options){window.__oidcInit=options;if(mode==='error')throw Error('Offline');this.authenticated=['member','realm-admin','client-admin','expired'].includes(mode);window.__expire=()=>this.onTokenExpired?.();return this.authenticated;}
   hasRealmRole(role){return ['realm-admin','expired'].includes(mode)&&role==='admin';}
   hasResourceRole(role,client){return mode==='client-admin'&&role==='admin'&&client==='ingenia-web';}
   async login(options){window.__loginOptions=options;}
   async accountManagement(){window.__accountOpened=true;}
   async logout(){this.clearToken();}
   clearToken(){this.authenticated=false;}
   async updateToken(){if(mode==='expired')throw Error('Expired');return true;}
  }`
 }));
}
module.exports = { mockIdentity };
