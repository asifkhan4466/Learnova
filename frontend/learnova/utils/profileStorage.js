const fields = ['name', 'email', 'phone', 'bio', 'image', 'specialization', 'experience', 'username', 'program', 'department', 'semester'];
export function readProfile(id, defaults) {
  try { const saved = JSON.parse(localStorage.getItem(`learnova_profile_${id}`) || '{}'); return { ...defaults, ...Object.fromEntries(fields.filter(key => typeof saved[key] === 'string').map(key => [key, saved[key]])) }; }
  catch { return defaults; }
}
export function saveProfile(id, profile) {
  if (!profile.name?.trim()) throw new Error('Enter your full name.');
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error('Enter a valid email address.');
  if (profile.username !== undefined && !/^[a-zA-Z0-9._-]{3,30}$/.test(profile.username.trim())) throw new Error('Username must be 3-30 letters, numbers, dots, underscores or hyphens.');
  const safe = Object.fromEntries(fields.filter(key => typeof profile[key] === 'string').map(key => [key, profile[key].trim()]));
  try { localStorage.setItem(`learnova_profile_${id}`, JSON.stringify(safe)); }
  catch { throw new Error('Profile could not be saved. Try a smaller image.'); }
  window.dispatchEvent(new Event("learnova:profile-updated"));
  return { ...profile, ...safe };
}
export function readProfileImage(file) {
  return new Promise((resolve, reject) => {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { reject(new Error('Choose a PNG, JPEG or WebP image up to 2 MB.')); return; }
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Image could not be read.')); reader.readAsDataURL(file);
  });
}
