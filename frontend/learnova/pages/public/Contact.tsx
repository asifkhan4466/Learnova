import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";

function Contact() {
  const [message,setMessage] = useState("");
  return (
    <main className="contact-page">

      <section className="contact-header">
        <span>Get In Touch</span>

        <h1>Contact Learnova</h1>

        <p>
          Have a question or need help? Send us a message and
          our team will get back to you.
        </p>
      </section>


      <section className="contact-content">

        <div className="contact-info">

          <span className="section-label">
            Contact Us
          </span>

          <h2>We&apos;re here to help</h2>

          <p>
            If you have questions about courses, enrollment,
            payments or your Learnova account, feel free to
            contact us.
          </p>

          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <div>
              <h3>Email</h3>
              <p>support@learnova.com</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div>
              <h3>Phone</h3>
              <p>+92 300 0000000</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div>
              <h3>Location</h3>
              <p>Pakistan</p>
            </div>
          </div>

        </div>


        <div className="contact-form-card">

          <h2>Send us a message</h2>

          <form className="contact-form" onSubmit={(event: LegacyValue) => { event.preventDefault(); setMessage("Message delivery will be available when the backend is connected. Your message has not been sent."); }}>

            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
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
              <label>Subject</label>

              <input
                type="text"
                placeholder="Enter subject"
              />
            </div>

            <div className="form-group">
              <label>Message</label>

              <textarea
                rows={"5" as unknown as number}
                placeholder="Write your message..."
              ></textarea>
            </div>

            <button type="submit" className="contact-submit">
              Send Message
            </button>

          </form>
          {message && <p role="status">{message}</p>}

        </div>

      </section>

    </main>
  );
}

export default Contact;