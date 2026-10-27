import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Keycloak from 'keycloak-js';

const url=import.meta.env.VITE_KEYCLOAK_URL?.trim();
const realm=import.meta.env.VITE_KEYCLOAK_REALM?.trim();
const clientId=import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim();
const adminRole=import.meta.env.VITE_KEYCLOAK_ADMIN_ROLE?.trim() || 'admin';
const googleIdp=import.meta.env.VITE_KEYCLOAK_GOOGLE_IDP?.trim();
const configured=Boolean(url&&realm&&clientId);
let client:Keycloak|undefined;
let initialization:Promise<boolean>|undefined;
function initialize(){
 if(!configured)throw new Error('Falta configurar Keycloak.');
 if(!initialization){
  client=new Keycloak({url:url!,realm:realm!,clientId:clientId!});
  // Process an explicit login callback, but never redirect public visitors for SSO.
  initialization=client.init({pkceMethod:'S256',checkLoginIframe:false,responseMode:'query',redirectUri:window.location.origin+'/'});
 }
 return initialization;
}
type AuthState={loading:boolean;authenticated:boolean;isAdmin:boolean;name:string;email:string;username:string;emailVerified:boolean|null;error:string};
type AuthContextValue=AuthState&{configured:boolean;googleAvailable:boolean;requiredRole:string;clientId:string;realm:string;login:(google?:boolean)=>Promise<void>;logout:()=>Promise<void>;manageAccount:()=>Promise<void>};
const initial:AuthState={loading:configured,authenticated:false,isAdmin:false,name:'',email:'',username:'',emailVerified:null,error:''};
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<AuthState>(initial);
 const sessionClosing=useRef(false);
 useEffect(()=>{
  if(!configured)return;
  let active=true;
  function sync(){if(sessionClosing.current){client?.clearToken();return;}if(active)setState({loading:false,authenticated:!!client?.authenticated,isAdmin:!!client?.authenticated&&!!(client.hasRealmRole(adminRole)||client.hasResourceRole(adminRole,clientId!)),name:client?.tokenParsed?.name||client?.tokenParsed?.preferred_username||'Administrador',email:client?.tokenParsed?.email||'',username:client?.tokenParsed?.preferred_username||'',emailVerified:typeof client?.tokenParsed?.email_verified==='boolean'?client.tokenParsed.email_verified:null,error:''});}
  function fail(){if(sessionClosing.current)return;client?.clearToken();if(active)setState({...initial,loading:false,error:'La sesión no está disponible. Inicia sesión nuevamente.'});}
  function refresh(){client?.updateToken(45).then(sync).catch(fail);}
  Promise.resolve().then(initialize).then(()=>{if(active&&client){client.onTokenExpired=refresh;client.onAuthLogout=fail;}sync();}).catch(()=>{if(active)setState({...initial,loading:false,error:'No pudimos conectar con Keycloak. Comprueba su dirección y la configuración del cliente.'});});
  const timer=window.setInterval(()=>{
   if(client?.authenticated&&!sessionClosing.current)refresh();
  },15000);
  return()=>{active=false;window.clearInterval(timer);if(client){client.onTokenExpired=undefined;client.onAuthLogout=undefined;}};
 },[]);
 async function login(google=false){
  if(!configured||!client||state.loading)return;
  sessionClosing.current=false;
  try{await client.login({redirectUri:window.location.origin+'/',...(google&&googleIdp?{idpHint:googleIdp}:{})});}
  catch{setState(s=>({...s,error:'No se pudo iniciar sesión. Inténtalo nuevamente.'}));}
 }
 async function manageAccount(){
  if(!client?.authenticated)throw new Error('Se requiere iniciar sesión.');
  await client.accountManagement();
 }
 async function logout(){
  // Revoke local access immediately; an in-flight refresh must not restore it.
  sessionClosing.current=true;
  setState({...initial,loading:false});
  try{const pending=client?.logout({redirectUri:window.location.origin+'/'});client?.clearToken();await pending;}
  catch{client?.clearToken();setState({...initial,loading:false,error:'La sesión local se cerró. No se pudo confirmar el cierre en el proveedor.'});}
 }
 return <AuthContext.Provider value={{...state,configured,googleAvailable:!!googleIdp,requiredRole:adminRole,clientId:clientId||'',realm:realm||'',login,logout,manageAccount}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const auth=useContext(AuthContext);if(!auth)throw new Error('Falta AuthProvider.');return auth;}
