import { BrowserCacheLocation, type Configuration } from '@azure/msal-browser';
export const tenantId=import.meta.env.VITE_ENTRA_TENANT_ID?.trim()||'';
export const clientId=import.meta.env.VITE_ENTRA_CLIENT_ID?.trim()||'';
export const requiredRole=import.meta.env.VITE_ENTRA_ADMIN_ROLE?.trim()||'administrator';
export const apiScopes=(import.meta.env.VITE_ENTRA_API_SCOPES||'').split(/[;\s]+/).map((s:string)=>s.trim()).filter(Boolean) as string[];
const guid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const configured=guid.test(tenantId)&&guid.test(clientId);
export const redirectUri=window.location.origin+'/';
export const loginScopes=['openid','profile','email',...apiScopes];
export const msalConfig:Configuration={
 auth:{clientId,authority:`https://login.microsoftonline.com/${tenantId}`,redirectUri,postLogoutRedirectUri:redirectUri},
 cache:{cacheLocation:BrowserCacheLocation.SessionStorage},
 system:{allowPlatformBroker:false},
};
