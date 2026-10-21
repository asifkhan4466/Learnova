import { useSyncExternalStore } from "react";
import useCourses from "./useCourses";
import { getCourses } from "./courseStorage";
const key="learnova_categories";
const event="learnova:categories-updated";
function snapshot(){try{return localStorage.getItem(key)||"[]";}catch{return "[]";}}
function saved(){try{const rows=JSON.parse(snapshot());return Array.isArray(rows)?rows.filter(value=>typeof value==="string"):[];}catch{return [];}}
function subscribe(listener){window.addEventListener(event,listener);window.addEventListener("storage",listener);return()=>{window.removeEventListener(event,listener);window.removeEventListener("storage",listener);};}
function write(rows){try{localStorage.setItem(key,JSON.stringify(rows));}catch{throw new Error("Categories could not be saved.");}window.dispatchEvent(new Event(event));}
export function addCategory(value){const name=value.trim().replace(/\s+/g," ");if(!name)throw new Error("Enter a category name.");if([...saved(),...getCourses().map(course=>course.category)].some(value=>value.toLowerCase()===name.toLowerCase()))throw new Error("Category already exists.");write([...saved(),name]);}
export function removeCategory(name){if(getCourses().some(course=>course.category===name))throw new Error("Move this category's courses to another category before removing it.");write(saved().filter(value=>value!==name));}
export default function useCategories(){const courses=useCourses();useSyncExternalStore(subscribe,snapshot);return [...new Set([...courses.map(course=>course.category).filter(Boolean),...saved()])];}
