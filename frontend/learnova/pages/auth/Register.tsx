import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { useLocation, useNavigate } from "@/lib/navigation";

function Register() {
  const [message,setMessage] = useState("");
  const navigate = useNavigate();
  const { search } = useLocation();
  return (
    <div className="auth-page">

      <div className="register-card">

        <div className="auth-header">
          <h1>Create Your Account</h1>

          <p>
            Join Learnova and start your learning journey.
          </p>
        </div>

        <form className="register-form" onSubmit={(event: LegacyValue) => { event.preventDefault(); setMessage("Account details captured for this frontend demo. Continue to student login."); navigate(`/login/student${search}`, { replace: true }); }}>

          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>User ID</label>

            <input
              type="text"
              placeholder="Create your user ID"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" className="register-submit">
            Create Account
          </button>

        </form>
          {message && <p role="status">{message}</p>}

        <div className="login-link">
          Already have an account?
          <a href={`/login/student${search}`}> Login</a>
        </div>

      </div>

    </div>
  );
}

export default Register;