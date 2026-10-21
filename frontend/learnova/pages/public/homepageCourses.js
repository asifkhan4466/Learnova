// Homepage discovery navigation; course records live in src/data/courses.js.
export function discoveryLink(query) {
  return `/?q=${encodeURIComponent(query)}#featured-courses`;
}
