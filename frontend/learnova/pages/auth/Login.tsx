import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { loginSubAdmin } from "../../utils/adminPermissions";

import { Link, useLocation, useNavigate } from "@/lib/navigation";

function Login({ role }: LegacyValue) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: LegacyValue) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      if (role.id === "subadmin") await loginSubAdmin(data.get("identifier"), data.get("password"));
      navigate(role.id === "student" && new URLSearchParams(search).get("course") ? `/student/payments?course=${encodeURIComponent((new URLSearchParams(search).get("course") as LegacyValue))}` : `/${role.path || role.id}/dashboard`, { replace: true });
    } catch (error: LegacyValue) { setError(error.message); }
    finally { setBusy(false); }
  }
  const { search, state } = useLocation();
  const backParams = new URLSearchParams(search);
  if (["admin", "subadmin"].includes(role.id)) backParams.set("group", "admin");
  const backQuery = backParams.toString() ? `?${backParams}` : "";
  const forgotParams = new URLSearchParams(search);
  forgotParams.set("role", role.id);
  return (
    <div className="auth-page">

      <div className="login-card">

        <div className="auth-header">
          <h1>Welcome {role.name}</h1>

          <p>
            {role.subtitle}
          </p>
        </div>

        <form className="login-form" onSubmit={submit}>

          <div className="form-group">
            <label htmlFor="login-identifier">Email or User ID</label>

            <input
              type="text"
              id="login-identifier" name="identifier" required={role.id === "subadmin"}
              autoComplete="username"
              placeholder="Enter your email or user ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>

            <input
              type="password"
              id="login-password" name="password" required={role.id === "subadmin"}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>

            <Link to={`/forgot-password?${forgotParams}`} state={state}>
              Forgot Password?
            </Link>
          </div>

          {error && <p role="alert">{error}</p>}
          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? "Logging in..." : "Login"}
          </button>

        </form>

        {role.id === "student" && <div className="register-link">
          Don&apos;t have an account?
          <Link to={`/register${search}`} state={state}> Create Account</Link>
        </div>}

        <Link className="login-role-back" to={`/login${backQuery}`} state={state}>Back to role selection</Link>

      </div>

    </div>
  );
}

export default Login;