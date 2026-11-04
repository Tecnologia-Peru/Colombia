import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import { adminObjectIds, apiScopes, clientId, configured, loginScopes, msalConfig, redirectUri, requiredRole, tenantId } from './entraConfig';

let msal:PublicClientApplication|undefined;
let initialization:Promise<AccountInfo|null>|undefined;
function allowed(account:AccountInfo){
 const claims=account.idTokenClaims;
 return account.tenantId===tenantId&&claims?.tid===tenantId&&claims?.aud===clientId;
}
// The token response is authoritative; AccountInfo can originate from an older cache entry.
function responseAccount(result:AuthenticationResult|null):AccountInfo|null{
 if(!result?.account)return null;
 const claims=(result.idTokenClaims??result.account.idTokenClaims) as AccountInfo['idTokenClaims'];
 return {...result.account,idTokenClaims:claims};
}
function initialize(){
 if(!configured)throw new Error('Falta configurar Microsoft Entra ID.');
 if(!initialization){
  msal=new PublicClientApplication(msalConfig);
  initialization=(async()=>{
   await msal!.initialize();
   // Handle only an explicit login response; never trigger interactive SSO on load.
   const response=await msal!.handleRedirectPromise({navigateToLoginRequestUrl:false});
   const returnedAccount=responseAccount(response);
   if(returnedAccount&&!allowed(returnedAccount))throw new Error('La cuenta no pertenece a la organización o aplicación configurada.');
   const active=msal!.getActiveAccount();
   const account=returnedAccount||(active&&allowed(active)?active:null)||msal!.getAllAccounts().find(allowed)||null;
   if(account&&Number(account.idTokenClaims?.exp||0)*1000<Date.now()+60000){
    const refreshed=await msal!.acquireTokenSilent({account,scopes:apiScopes.length?apiScopes:['openid','profile','email'],forceRefresh:true});
    const updated=responseAccount(refreshed);msal!.setActiveAccount(updated);return updated;
   }
   msal!.setActiveAccount(account);
   return account;
  })();
 }
 return initialization;
}
type AuthState={loading:boolean;authenticated:boolean;isAdmin:boolean;name:string;email:string;username:string;emailVerified:boolean|null;roles:string[];objectId:string;error:string};
type AuthContextValue=AuthState&{configured:boolean;requiredRole:string;clientId:string;tenantId:string;login:()=>Promise<void>;logout:()=>Promise<void>;manageAccount:()=>Promise<void>;getApiAccessToken:()=>Promise<string>;refreshPermissions:()=>Promise<void>};
const initial:AuthState={loading:configured,authenticated:false,isAdmin:false,name:'',email:'',username:'',emailVerified:null,roles:[],objectId:'',error:''};
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<AuthState>(initial);
 const accountRef=useRef<AccountInfo|null>(null);
 const epoch=useRef(0);
 const closing=useRef(false);
 function sync(account:AccountInfo|null){
  if(closing.current)return;
  if(account&&!allowed(account)){setState({...initial,loading:false,error:'La cuenta no pertenece al tenant o a la aplicación autorizada.'});return;}
  accountRef.current=account;
  const claims=account?.idTokenClaims;
  const roles=Array.isArray(claims?.roles)?claims.roles.filter((role):role is string=>typeof role==='string'):[];
  const objectId=typeof claims?.oid==='string'?claims.oid.toLowerCase():'';
  const listedUser=!!objectId&&adminObjectIds.includes(objectId);
  setState({loading:false,authenticated:!!account,isAdmin:!!account&&(roles.includes(requiredRole)||listedUser),name:account?.name||account?.username||'',email:typeof claims?.email==='string'?claims.email:account?.username||'',username:account?.username||'',emailVerified:null,roles,objectId,error:''});
 }
 useEffect(()=>{
  if(!configured)return;
  let active=true;
  let refreshing=false;
  Promise.resolve().then(initialize).then(account=>{if(active)sync(account);}).catch(()=>{if(active)setState({...initial,loading:false,error:'No se pudo completar la sesión con Microsoft Entra ID. Revisa el tenant, el cliente y la URI de redirección SPA.'});});
  const timer=window.setInterval(async()=>{
   const account=accountRef.current;
   if(!active||closing.current||refreshing||!account||!msal)return;
   refreshing=true;const generation=epoch.current;
   try{
    const exp=Number(account.idTokenClaims?.exp||0);
    const result=await msal.acquireTokenSilent({account,scopes:apiScopes.length?apiScopes:['openid','profile','email'],forceRefresh:exp*1000<Date.now()+60000});
    if(active&&!closing.current&&generation===epoch.current)sync(responseAccount(result));
    else if(closing.current)void msal.clearCache({account}).catch(()=>{});
   }catch{
    if(active&&!closing.current&&generation===epoch.current){
     accountRef.current=null;msal.setActiveAccount(null);
     setState({...initial,loading:false,error:'La sesión necesita validarse nuevamente. Pulsa Iniciar sesión para continuar.'});
     void msal.clearCache({account}).catch(()=>{});
    }
   }finally{refreshing=false;}
  },30000);
  return()=>{active=false;window.clearInterval(timer);};
 },[]);
 async function login(){
  if(!configured||state.loading||!msal)return;
  closing.current=false;epoch.current++;
  try{await msal.loginRedirect({scopes:loginScopes,redirectUri,prompt:'select_account'});}
  catch{setState(s=>({...s,error:'No se pudo iniciar sesión con Microsoft. Comprueba la configuración y el consentimiento de los permisos solicitados.'}));}
 }
 async function refreshPermissions(){
  const account=accountRef.current;
  if(!msal||!account||closing.current||!allowed(account))throw new Error('Se requiere iniciar sesión.');
  const generation=++epoch.current;
  try{
   // Bypass token cache and request current claims after a role assignment.
   const result=await msal.acquireTokenSilent({account,scopes:loginScopes,forceRefresh:true});
   if(closing.current||generation!==epoch.current){if(closing.current)await msal.clearCache({account});return;}
   const updated=responseAccount(result);
   if(!updated||!allowed(updated))throw new Error('La respuesta no pertenece a la aplicación o al tenant configurado.');
   msal.setActiveAccount(updated);sync(updated);
  }catch{
   if(!closing.current&&generation===epoch.current)throw new Error('No se pudieron renovar los permisos. Cierra sesión y vuelve a entrar con Microsoft.');
  }
 }
 async function getApiAccessToken(){
  const account=accountRef.current;const generation=epoch.current;
  if(!msal||!account||closing.current||!allowed(account))throw new Error('Se requiere una sesión de la organización.');
  if(!apiScopes.length)throw new Error('No hay scopes de API configurados.');
  const result=await msal.acquireTokenSilent({account,scopes:apiScopes});
  if(closing.current||generation!==epoch.current){await msal.clearCache({account});throw new Error('La sesión se cerró durante la solicitud.');}
  return result.accessToken;
 }
 async function manageAccount(){
  if(!accountRef.current||closing.current)throw new Error('Se requiere iniciar sesión.');
  window.location.assign(`https://myaccount.microsoft.com/?tenantId=${encodeURIComponent(tenantId)}`);
 }
 async function logout(){
  const account=accountRef.current;closing.current=true;epoch.current++;accountRef.current=null;
  setState({...initial,loading:false});
  try{await msal?.logoutRedirect({account,postLogoutRedirectUri:redirectUri});}
  catch{
   try{await msal?.clearCache(account?{account}:undefined);}catch{/* Access remains revoked even if browser storage is unavailable. */}
   msal?.setActiveAccount(null);
   setState({...initial,loading:false,error:'Se cerró el acceso local, pero no se pudo confirmar el cierre en Microsoft.'});
  }
 }
 return <AuthContext.Provider value={{...state,configured,requiredRole,clientId,tenantId,login,logout,manageAccount,getApiAccessToken,refreshPermissions}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const auth=useContext(AuthContext);if(!auth)throw new Error('Falta AuthProvider.');return auth;}
