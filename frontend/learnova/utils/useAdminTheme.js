import { useSyncExternalStore } from "react";
export const themeColors={blue:"#0068ff",purple:"#7815ed",cyan:"#007f99",gold:"#946000",navy:"#062456"};
const key="learnova_subadmin_theme";
function read(){const value=localStorage.getItem(key);return themeColors[value] ? value : "blue";}
function subscribe(fn){window.addEventListener("storage",fn);window.addEventListener("learnova:theme",fn);return ()=>{window.removeEventListener("storage",fn);window.removeEventListener("learnova:theme",fn);};}
export function setSubAdminTheme(color){if(!themeColors[color])return;localStorage.setItem(key,color);window.dispatchEvent(new Event("learnova:theme"));}
export default function useAdminTheme(){return useSyncExternalStore(subscribe,read);}
