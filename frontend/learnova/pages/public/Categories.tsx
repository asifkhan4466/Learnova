import type { LegacyValue } from "../../../lib/legacy-types";

const categories = [
  {
    id: 1,
    icon: "💻",
    name: "Development",
    description: "Learn programming and modern web development.",
    courses: "25 Courses"
  },
  {
    id: 2,
    icon: "🎨",
    name: "Design",
    description: "Build your UI/UX and creative design skills.",
    courses: "18 Courses"
  },
  {
    id: 3,
    icon: "📊",
    name: "Data & Analytics",
    description: "Learn data analysis and business intelligence.",
    courses: "15 Courses"
  },
  {
    id: 4,
    icon: "📱",
    name: "Mobile Development",
    description: "Create modern Android and mobile applications.",
    courses: "12 Courses"
  },
  {
    id: 5,
    icon: "🤖",
    name: "Artificial Intelligence",
    description: "Explore AI, machine learning and intelligent systems.",
    courses: "10 Courses"
  },
  {
    id: 6,
    icon: "🗄️",
    name: "Database",
    description: "Learn SQL, database design and management.",
    courses: "8 Courses"
  }
];

function Categories() {
  return (
    <main className="categories-page">

      <section className="categories-header">
        <span>Explore Learnova</span>

        <h1>Course Categories</h1>

        <p>
          Explore different learning categories and find courses
          that match your interests and goals.
        </p>
      </section>


      <section className="all-categories">

        <div className="categories-grid">

          {categories.map((category: LegacyValue) => (
            <div
              className="category-card"
              key={category.id}
            >

              <div className="category-icon">
                {category.icon}
              </div>

              <h2>{category.name}</h2>

              <p>{category.description}</p>

              <span className="category-courses">
                {category.courses}
              </span>

              <a href="/courses" className="category-btn">
                Explore Courses
              </a>

            </div>
          ))}

        </div>

      </section>

    </main>
  );
}

export default Categories;