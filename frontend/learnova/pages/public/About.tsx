
function About() {
  return (
    <main className="about-page">

      <section className="about-header">
        <span>About Learnova</span>

        <h1>Learn. Grow. Succeed.</h1>

        <p>
          Learnova is a professional learning platform designed
          to help students develop practical skills through quality
          courses and experienced teachers.
        </p>
      </section>


      <section className="about-content">

        <div className="about-text">
          <span className="section-label">
            Who We Are
          </span>

          <h2>
            Making learning simple and accessible
          </h2>

          <p>
            Learnova provides students with an organized learning
            environment where they can discover courses, learn from
            teachers, attend live classes and track their progress.
          </p>

          <p>
            Our goal is to create a simple and professional platform
            that connects students with useful educational content
            and practical learning experiences.
          </p>
        </div>

        <div className="about-stats">

          <div className="about-stat-card">
            <h3>100+</h3>
            <p>Courses</p>
          </div>

          <div className="about-stat-card">
            <h3>50+</h3>
            <p>Teachers</p>
          </div>

          <div className="about-stat-card">
            <h3>1K+</h3>
            <p>Students</p>
          </div>

          <div className="about-stat-card">
            <h3>95%</h3>
            <p>Satisfaction</p>
          </div>

        </div>

      </section>


      <section className="about-values">

        <div className="section-heading">
          <span>Our Values</span>

          <h2>What makes Learnova different</h2>

          <p>
            We focus on creating a better and more organized
            learning experience.
          </p>
        </div>

        <div className="values-grid">

          <div className="value-card">
            <div className="value-icon">🎓</div>
            <h3>Quality Learning</h3>
            <p>
              Organized courses designed to provide useful
              knowledge and practical skills.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon">👨‍🏫</div>
            <h3>Expert Teachers</h3>
            <p>
              Students can learn from experienced and skilled
              instructors.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon">📚</div>
            <h3>Flexible Learning</h3>
            <p>
              Access your learning content and courses from
              anywhere.
            </p>
          </div>

        </div>

      </section>


      <section className="about-cta">

        <h2>Start your learning journey with Learnova</h2>

        <p>
          Explore our courses and start building valuable skills.
        </p>

        <a href="/courses" className="primary-btn">
          Explore Courses
        </a>

      </section>

    </main>
  );
}

export default About;