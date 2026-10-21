import type { LegacyValue } from "../../../lib/legacy-types";
import { students } from "../../data/operations";

import { readProfile, saveProfile, readProfileImage } from "../../utils/profileStorage";
import { useState } from "react";

function Profile() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(() => readProfile("STU-1001", {
    name: students[0].name,
    email: students[0].email,
    username: students[0].email.split("@")[0],
    userId: "STU-1001",
    phone: "+92 300 0000000",
    studentId: "2026-CS-001",
    program: "Software Engineering",
    department: "Computer Science",
    semester: "6th Semester",
    batch: "2023 - 2027",
    bio: "Welcome to Learnova. This section can contain a short introduction about the student and their learning goals.",
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
    try { setProfile(saveProfile("STU-1001", profile)); setEditing(false); setMessage("Profile saved."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  };
  async function upload(event: LegacyValue) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const image = await readProfileImage(file); setProfile((value: LegacyValue) => ({...value, image})); setMessage(""); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }

  return (
    <div className="student-profile">

      <div className="profile-header">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your personal and academic information.</p>
        </div>

        {!editing ? (
          <button
            className="edit-profile-btn"
            onClick={() => { setBackup({...profile}); setEditing(true); setMessage(""); }}
          >
            Edit Profile
          </button>
        ) : (
          <button
            className="edit-profile-btn"
            onClick={handleSave}
          >
            Save Changes
          </button>
        )}
      </div>

      {message && <p role="status">{message}</p>}
      {editing && <div className="profile-edit-tools"><label>Profile Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label><button onClick={() => setProfile((value: LegacyValue) => ({...value,image:""}))}>Remove Image</button><button onClick={() => { setProfile(backup); setEditing(false); setMessage(""); }}>Cancel</button></div>}
      <div className="profile-card">

        <div className="profile-top">

          <div className="profile-avatar">
            {profile.image ? <img src={profile.image} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : profile.name.charAt(0)}
          </div>

          <div className="profile-basic">
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
            <span>Student</span>
          </div>

        </div>

        <div className="profile-divider"></div>

        <div className="profile-section">

          <h3>Personal Information</h3>

          <div className="profile-grid">

            <div className="profile-field">
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

            <div className="profile-field">
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

            <div className="profile-field">
              <label htmlFor="student-username">Username</label>
              {editing ? <input id="student-username" name="username" value={profile.username} onChange={handleChange} autoComplete="username"/> : <p>{profile.username}</p>}
            </div>

            <div className="profile-field">
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

        <div className="profile-divider"></div>

        <div className="profile-section">

          <h3>Academic Information</h3>

          <div className="profile-grid">


            <div className="profile-field">
              <label>Program</label>
              {editing ? <input aria-label="Program" name="program" value={profile.program} onChange={handleChange}/> : <p>{profile.program}</p>}
            </div>

            <div className="profile-field">
              <label>Department</label>
              {editing ? <input aria-label="Department" name="department" value={profile.department} onChange={handleChange}/> : <p>{profile.department}</p>}
            </div>

            <div className="profile-field">
              <label>Semester</label>
              {editing ? <input aria-label="Semester" name="semester" value={profile.semester} onChange={handleChange}/> : <p>{profile.semester}</p>}
            </div>

            <div className="profile-field">
              <label>Batch</label>
              <p>{profile.batch}</p>
            </div>

            <div className="profile-field">
              <label>Registration Date</label>
              <p>September 01, 2026</p>
            </div>

          </div>

        </div>

        <div className="profile-divider"></div>

        <div className="profile-section">

          <h3>About Me</h3>

          {editing ? (
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={"4" as unknown as number}
            />
          ) : (
            <p className="profile-bio">{profile.bio}</p>
          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;