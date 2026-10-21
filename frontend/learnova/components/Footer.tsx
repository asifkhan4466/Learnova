import type { LegacyValue } from "../../lib/legacy-types";

import { Link } from "@/lib/navigation";
import PublicIcon from "./PublicIcon";
function Footer() {
  return (
    <footer className="footer public-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" aria-label="Learnova home"><img src="/Logo.png" alt="Learnova" width="106" height="106" /></Link>
          <p>Practical skills. New possibilities.<br />Your next chapter starts with learning.</p>
          <span className="footer-brand-note"><PublicIcon name="globe" /> Learning without limits.</span>
        </div>
        <div className="footer-column"><h3>Platform</h3><Link to="/">Home</Link><Link to="/courses">Courses</Link><Link to="/categories">Categories</Link><Link to="/about">About Learnova</Link></div>
        <div className="footer-column"><h3>Learning</h3>{["Development", "Design", "Data & Analytics", "Mobile Development"].map((category: LegacyValue) => <Link key={category} to={"/?q=" + encodeURIComponent(category) + "#featured-courses"}>{category}</Link>)}</div>
        <div className="footer-column"><h3>Your account</h3><Link to="/login">Log in</Link><Link to="/register">Create an account</Link><Link to="/login">Access your profile</Link><Link to="/forgot-password">Reset password</Link></div>
        <div className="footer-column"><h3>Here to help</h3><Link to="/contact">Contact us</Link><Link to="/contact">Learning support</Link><Link to="/about">How Learnova works</Link><Link to="/contact">Become an instructor <PublicIcon name="arrow" /></Link></div>
      </div>
      <div className="footer-bottom"><p>© 2026 Learnova. All rights reserved.</p><span>Learn. Grow. Achieve.</span><span><PublicIcon name="globe" /> English</span></div>
    </footer>
  );
}
export default Footer;
