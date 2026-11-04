// Test-only replacement for MSAL. Never imported into the frontend.
async function mockEntra(page,mode='admin'){
 await page.route(/\/node_modules\/\.vite\/deps\/@azure_msal-browser\.js(?:\?|$)/,route=>route.fulfill({contentType:'application/javascript',body:`
 export const BrowserCacheLocation={SessionStorage:'sessionStorage'};
 const mode=${JSON.stringify(mode)};
 export class PublicClientApplication {
  constructor(config){this.config=config;window.__entra={config,loginCalls:0,cacheClears:0};const tenant=config.auth.authority.split('/').pop();this.account=['guest','error'].includes(mode)?null:{homeAccountId:'demo-account',localAccountId:'demo',tenantId:mode==='foreign'?'foreign-tenant':tenant,username:'demo@example.com',name:'Administradora Demo',idTokenClaims:{tid:mode==='foreign'?'foreign-tenant':tenant,aud:mode==='wrong-audience'?'other-app':config.auth.clientId,name:'Administradora Demo',email:'demo@example.com',roles:['admin','logout-error','refresh-race'].includes(mode)?['administrator']:mode==='old-role'?['admin']:[],exp:Math.floor(Date.now()/1000)+3600}};}
  async initialize(){window.__entra.initialized=true;if(mode==='error')throw Error('Unavailable');}
  async handleRedirectPromise(options){window.__entra.redirectOptions=options;return this.account?{account:this.account}:null;}
  getActiveAccount(){return this.account;}
  getAllAccounts(){return this.account?[this.account]:[];}
  setActiveAccount(account){this.account=account;}
  async loginRedirect(request){window.__entra.loginCalls++;window.__entra.login=request;}
  async acquireTokenSilent(request){window.__entra.silent=request;if(mode==='refresh-race')await new Promise(resolve=>window.__finishRefresh=resolve);if(window.__failRefresh)throw Error('Interaction required');if(window.__revokeRole&&this.account)this.account.idTokenClaims.roles=[];return {account:this.account,accessToken:'synthetic-api-token'};}
  async logoutRedirect(request){window.__entra.logout=request;if(mode==='logout-error')throw Error('Offline');if(mode==='refresh-race')return new Promise(()=>{});this.account=null;}
  async clearCache(){window.__entra.cacheClears++;this.account=null;}
 }
 `}));
}
module.exports={mockEntra};
