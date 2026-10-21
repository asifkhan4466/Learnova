import useCourses from "./useCourses";
import useBatches from "./useBatches";
import { students, teachers, payments } from "../data/operations";

export default function useAdminOverview(){
 const courses=useCourses(),state=useBatches();
 const completed=state.enrollments.filter(e=>e.status==="Completed").length;
 return {courses, ...state, students, teachers, payments,
   recentEnrollments:[...state.enrollments].sort((a,b)=>new Date(b.enrollmentDate)-new Date(a.enrollmentDate)).slice(0,5),
   revenue:payments.filter(p=>p.status==="Approved").reduce((n,p)=>n+(Number(String(p.amount).replace(/[^0-9.]/g,""))||0),0),
   completion:state.enrollments.length?Math.round(completed/state.enrollments.length*100):0,
   topCourses:[...courses].sort((a,b)=>Number(b.students||0)-Number(a.students||0)).slice(0,5),
 };
}
