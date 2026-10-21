"use client";
import Login from "@/learnova/pages/auth/Login";
import { loginRoles } from "@/learnova/pages/auth/loginRoles";
export default function Page() { return <Login role={loginRoles[1]} />; }
