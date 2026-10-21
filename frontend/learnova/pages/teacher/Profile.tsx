import type { LegacyValue } from "../../../lib/legacy-types";
import PublicIcon from "../../components/PublicIcon";
import useCourses from "../../utils/useCourses";
import useBatches from "../../utils/useBatches";
import { teacherCourses, teacherStudents, teacherId } from "../../utils/batchStorage";
import { teachers } from "../../data/operations";

import { readProfile, saveProfile, readProfileImage } from "../../utils/profileStorage";
import { useState } from "react";

function Profile() {
  const courses = teacherCourses(useCourses());
  const students = teacherStudents(useBatches());
  const teacher = teachers.find((item: LegacyValue) => item.id === teacherId)!;
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(() => readProfile("TCH-1001", {
    name: teacher.name,
    email: teacher.email,
    userId: "TCH-1001",
    phone: "+92 300 0000000",
    specialization: "Web Development",
    experience: "3 Years",
    bio: "Experienced instructor focused on helping students build practical development skills.",
  }));

  const handleChange = (e: LegacyValue) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const [message, setMessage] = useState("");
  const [backup, setBackup] = useState<LegacyValue>(null);
  const handleSave = () => {
    try { setProfile(saveProfile("TCH-1001", profile)); setEditing(false); setMessage("Profile saved."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  };
  async function upload(event: LegacyValue) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const image = await readProfileImage(file); setProfile((value: LegacyValue) => ({...value, image})); setMessage(""); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }

  return (
    <div className="teacher-profile">

      <div className="teacher-profile-header">
        <div>
          <h1>Profile</h1>
          <p>View and manage your professional information.</p>
        </div>

        {!editing ? (
          <button
            className="teacher-edit-profile-btn"
            onClick={() => { setBackup({...profile}); setEditing(true); setMessage(""); }}
          >
            Edit Profile
          </button>
        ) : (
          <button
            className="teacher-edit-profile-btn"
            onClick={handleSave}
          >
            Save Changes
          </button>
        )}
      </div>

      {message && <p role="status">{message}</p>}
      {editing && <div className="profile-edit-tools"><label>Profile Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label><button onClick={() => setProfile((value: LegacyValue) => ({...value,image:""}))}>Remove Image</button><button onClick={() => { setProfile(backup); setEditing(false); setMessage(""); }}>Cancel</button></div>}
      <div className="teacher-profile-card">

        <div className="teacher-profile-top">

          <div className="teacher-profile-avatar">
            {profile.image ? <img src={profile.image} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : profile.name.charAt(0)}
          </div>

          <div className="teacher-profile-basic">
            <h2>{profile.name}</h2>
            <p>{profile.specialization}</p>
            <span>Teacher</span>
            <div className="tp-contact"><span><PublicIcon name="mail"/>{profile.email}</span><span><PublicIcon name="phone"/>{profile.phone}</span><span><PublicIcon name="users"/>{profile.userId}</span></div>
          </div>

        </div>

        

        <div className={`teacher-profile-section${editing ? "" : " tp-edit-only"}`}>

          <h3>Personal Information</h3>

          <div className="teacher-profile-grid">

            <div className="teacher-profile-field">
              <label>Full Name</label>

              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                />
              ) : (
                <p>{profile.name}</p>
              )}
            </div>

            <div className="teacher-profile-field">
              <label>Email</label>

              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                />
              ) : (
                <p>{profile.email}</p>
              )}
            </div>

            <div className="teacher-profile-field">
              <label>User ID</label>
              <p>{profile.userId}</p>
            </div>

            <div className="teacher-profile-field">
              <label>Phone Number</label>

              {editing ? (
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                />
              ) : (
                <p>{profile.phone}</p>
              )}
            </div>

          </div>

        </div>

        <div className="tp-overview">{[["Specialization",profile.specialization,"cap"],["Experience",profile.experience,"briefcase"],["Assigned Courses",courses.length,"book"],["Total Students",new Set(students.map((student: LegacyValue)=>student.studentId)).size,"users"]].map(([label,value,icon]: LegacyValue)=><article key={label}><span className="tp-icon"><PublicIcon name={icon}/></span><div><p>{label}</p><strong>{value}</strong>{editing && ["Specialization","Experience"].includes(label) && <input aria-label={label} name={label.toLowerCase()} value={value} onChange={handleChange}/>}</div></article>)}</div>
        <div className="teacher-profile-section">
          <h3>About Me</h3>

          {editing ? (
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={"4" as unknown as number}
            />
          ) : (
            <p className="teacher-profile-bio">
              {profile.bio}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;