import { useNavigate } from "@/lib/navigation";

import { useState } from "react";

function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  return (
    <div className="settings-page">

      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and notification preferences.</p>
        </div>
      </div>

      <div className="settings-card">

        <div className="settings-section">

          <h2>Account Settings</h2>
          <p className="settings-description">
            Manage your basic account preferences.
          </p>

          <div className="settings-row">
            <div>
              <h3>Email Address</h3>
              <p>student@learnova.com</p>
            </div>

            <button className="settings-action-btn" onClick={() => navigate("/student/profile")}>
              Change
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Password</h3>
              <p>Change your account password.</p>
            </div>

            <button className="settings-action-btn" onClick={() => navigate("/forgot-password?role=student")}>
              Change Password
            </button>
          </div>

        </div>

        <div className="settings-divider"></div>

        <div className="settings-section">

          <h2>Notification Preferences</h2>
          <p className="settings-description">
            Choose which notifications you want to receive.
          </p>

          <div className="settings-row">
            <div>
              <h3>Push Notifications</h3>
              <p>Receive notifications about your courses and classes.</p>
            </div>

            <button
              className={`toggle-btn ${
                notifications ? "active" : ""
              }`}
              onClick={() => setNotifications(!notifications)}
            >
              <span></span>
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Email Updates</h3>
              <p>Receive important updates through email.</p>
            </div>

            <button
              className={`toggle-btn ${
                emailUpdates ? "active" : ""
              }`}
              onClick={() => setEmailUpdates(!emailUpdates)}
            >
              <span></span>
            </button>
          </div>

        </div>

        <div className="settings-divider"></div>

        <div className="settings-section">

          <h2>Account Actions</h2>
          <p className="settings-description">
            Manage your Learnova account.
          </p>

          <div className="settings-row">
            <div>
              <h3>Logout</h3>
              <p>Sign out from your Learnova account.</p>
            </div>

            <button className="logout-settings-btn" onClick={() => navigate("/login/student")}>
              Logout
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Settings;