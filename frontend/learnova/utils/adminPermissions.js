export const ADMIN_PERMISSION_KEY = "learnova_admin_permissions";
const seedSubAdmins = [
  { id: "SA-1001", name: "Admin", email: "subadmin@learnova.com", status: "Active" },
  { id: "SA-1002", name: "Operations Admin", email: "operations@learnova.com", status: "Active" },
];
const accountsKey = "learnova_subadmin_accounts";
function readAccounts(raw = localStorage.getItem(accountsKey)) {
  const saved = JSON.parse(raw || "null");
  if (saved === null) return [...seedSubAdmins];
  // Migrate the earlier format, which stored only newly created accounts.
  if (Array.isArray(saved)) return [...seedSubAdmins, ...saved];
  if (!Array.isArray(saved.accounts)) throw new Error("Admin accounts could not be loaded.");
  return saved.accounts;
}
function writeAccounts(accounts) {
  localStorage.setItem(accountsKey, JSON.stringify({ accounts }));
  subAdmins.splice(0, subAdmins.length, ...accounts);
  window.dispatchEvent(new Event(permissionEvent));
}
export const subAdmins = readAccounts();
export const operationalPermissions = [
  ["students", "Manage Students"], ["teachers", "Manage Teachers"],
  ["courses", "Manage Courses"], ["batches", "Manage Batches"],
  ["enrollments", "Manage Enrollments"], ["payments", "Verify Payments"],
  ["liveClasses", "Manage Live Classes", "live-classes"], ["content", "Manage Lectures & Content"], ["assignments", "Manage Assignments"],
  ["certificates", "Manage Certificates"],
  ["reports", "View Reports"], ["publicWebsite", "Manage Public Website", "public-content"],
];
export const publicPermissions = [
  ["homepage", "Manage Homepage Content"], ["publicCourses", "Manage Public Courses"],
  ["banners", "Manage Banners"], ["announcements", "Manage Announcements / Posts"],
  ["instructorProfiles", "Manage Instructor Public Profiles"],
];

export let currentSubAdminId = sessionStorage.getItem("learnova_subadmin_session") || "";
const permissionEvent = "learnova:permissions-changed";

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSubAdmin({ name, email, id, password, modules = {} }) {
  name = name.trim(); email = email.trim().toLowerCase(); id = id.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a name and valid email address.");
  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(id)) throw new Error("ID must be 3–40 letters, numbers, hyphens or underscores.");
  if (password.length < 8) throw new Error("Password must contain at least 8 characters.");
  const salt = crypto.randomUUID();
  const hash = await passwordHash(password, salt);
  const saved = readAccounts();
  if (saved.some(person => person.id.toLowerCase() === id.toLowerCase() || person.email.toLowerCase() === email)) throw new Error("A Admin with this ID or email already exists.");
  const initialPermissions = Object.fromEntries([...operationalPermissions, ...publicPermissions].map(([key]) => [key, modules[key] === true && (!publicPermissions.some(([name]) => name === key) || modules.publicWebsite === true)]));
  // Frontend demo only: retain the assigned test password for the Super Admin profile preview.
  const person = { id, name, email, status: "Active", salt, passwordHash: hash, demoPassword: password, initialPermissions };
  writeAccounts([...saved, person]);
  return person;
}

export async function updateSubAdmin(id, { id: newId = id, name, email, status, password = "" }) {
  newId = newId.trim();
  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(newId)) throw new Error("ID must be 3 to 40 letters, numbers, hyphens or underscores.");
  name = name.trim(); email = email.trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a name and valid email address.");
  if (!["Active", "Inactive", "Pending"].includes(status)) throw new Error("Select a valid account status.");
  if (password && password.length < 8) throw new Error("Password must contain at least 8 characters.");
  let credentials = {};
  if (password) {
    const salt = crypto.randomUUID();
    credentials = { salt, passwordHash: await passwordHash(password, salt), demoPassword: password };
  }
  const saved = readAccounts();
  const person = saved.find(person => person.id === id);
  if (!person) throw new Error("This Admin no longer exists.");
  if (saved.some(person => person.id !== id && person.id.toLowerCase() === newId.toLowerCase())) throw new Error("A Admin with this ID already exists.");
  if (saved.some(person => person.id !== id && person.email.toLowerCase() === email)) throw new Error("A Admin with this email already exists.");
  const updated = { ...person, id: newId, name, email, status, ...credentials };
  if (newId === id) {
    writeAccounts(saved.map(person => person.id === id ? updated : person));
    return updated;
  }
  const permissions = readAdminPermissions();
  permissions[newId] = permissions[id];
  delete permissions[id];
  const oldProfileKey = `learnova_profile_${id}`;
  const newProfileKey = `learnova_profile_${newId}`;
  const previous = new Map([accountsKey, ADMIN_PERMISSION_KEY, oldProfileKey, newProfileKey].map(key => [key, localStorage.getItem(key)]));
  const session = sessionStorage.getItem("learnova_subadmin_session");
  try {
    localStorage.setItem(ADMIN_PERMISSION_KEY, JSON.stringify(permissions));
    const profile = previous.get(oldProfileKey);
    if (profile !== null) localStorage.setItem(newProfileKey, profile);
    else localStorage.removeItem(newProfileKey);
    localStorage.removeItem(oldProfileKey);
    if (session === id) sessionStorage.setItem("learnova_subadmin_session", newId);
    localStorage.setItem(accountsKey, JSON.stringify({ accounts: saved.map(person => person.id === id ? updated : person) }));
  } catch (error) {
    for (const [key, value] of previous) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    if (session === null) sessionStorage.removeItem("learnova_subadmin_session");
    else sessionStorage.setItem("learnova_subadmin_session", session);
    throw error;
  }
  if (currentSubAdminId === id) currentSubAdminId = newId;
  subAdmins.splice(0, subAdmins.length, ...saved.map(person => person.id === id ? updated : person));
  window.dispatchEvent(new Event(permissionEvent));
  window.dispatchEvent(new Event("learnova:profile-updated"));
  return updated;
}

export function deleteSubAdmin(id) {
  const saved = readAccounts();
  if (!saved.some(person => person.id === id)) throw new Error("This Admin no longer exists.");
  // Remove saved access before removing the account, so a reused ID cannot inherit it.
  const permissions = readAdminPermissions();
  delete permissions[id];
  localStorage.setItem(ADMIN_PERMISSION_KEY, JSON.stringify(permissions));
  writeAccounts(saved.filter(person => person.id !== id));
  if (currentSubAdminId === id) logoutSubAdmin();
}

export async function loginSubAdmin(identifier, password) {
  const saved = readAccounts();
  const person = saved.find(person => [person.id.toLowerCase(), person.email.toLowerCase()].includes(identifier.trim().toLowerCase()));
  if (!person || !person.passwordHash || person.status !== "Active" || await passwordHash(password, person.salt) !== person.passwordHash) throw new Error("Invalid Admin ID/email or password.");
  person.lastLogin = new Date().toLocaleString();
  localStorage.setItem(accountsKey, JSON.stringify({ accounts: saved }));
  sessionStorage.setItem("learnova_subadmin_session", person.id);
  currentSubAdminId = person.id;
  subAdmins.splice(0, subAdmins.length, ...saved);
  window.dispatchEvent(new Event(permissionEvent));
}

export function logoutSubAdmin() {
  sessionStorage.removeItem("learnova_subadmin_session");
  currentSubAdminId = "";
}

export function permissionSnapshot() {
  try { return JSON.stringify([localStorage.getItem(ADMIN_PERMISSION_KEY) || "{}", localStorage.getItem(accountsKey) || "[]"]); }
  catch { return "{}"; }
}

export function subscribePermissions(listener) {
  const onStorage = event => {
    if ([ADMIN_PERMISSION_KEY, accountsKey, null].includes(event.key)) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(permissionEvent, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(permissionEvent, listener);
  };
}

export function readAdminPermissions(snapshot = permissionSnapshot()) {
  try {
    const parsed = JSON.parse(snapshot) || {};
    const saved = Array.isArray(parsed) ? JSON.parse(parsed[0]) : parsed;
    if (Array.isArray(parsed)) subAdmins.splice(0, subAdmins.length, ...readAccounts(parsed[1]));
    return Object.fromEntries(
      subAdmins.map(person => {
        const userSaved = saved?.[person.id];
        const hasSavedConfig = userSaved && typeof userSaved === "object" && !Array.isArray(userSaved);
        return [
          person.id,
          Object.fromEntries(
            [...operationalPermissions, ...publicPermissions].map(([key]) => [
              key,
              hasSavedConfig ? userSaved[key] === true : person.initialPermissions?.[key] === true
            ])
          )
        ];
      })
    );
  } catch {
    return Object.fromEntries(
      subAdmins.map(person => [
        person.id,
        Object.fromEntries([...operationalPermissions, ...publicPermissions].map(([key]) => [key, false]))
      ])
    );
  }
}

export function changeAdminPermission(id, key, enabled) {
  const permissions = readAdminPermissions();
  if (!subAdmins.some(person => person.id === id) || ![...operationalPermissions, ...publicPermissions].some(([name]) => name === key)) throw new Error("Unknown permission or Admin.");
  if (publicPermissions.some(([name]) => name === key) && !permissions[id]?.publicWebsite) throw new Error("Enable Manage Public Website first.");
  const next = { ...permissions, [id]: { ...permissions[id], [key]: enabled === true } };
  if (key === "publicWebsite" && !enabled) for (const [name] of publicPermissions) next[id][name] = false;
  try { localStorage.setItem(ADMIN_PERMISSION_KEY, JSON.stringify(next)); }
  catch { throw new Error("Permissions could not be saved in this browser."); }
  window.dispatchEvent(new Event(permissionEvent));
  return next;
}

// Frontend visibility policy only, not authentication or server-side authorization.
export function canManagePublicContent(role, subAdminId, permission, permissions = readAdminPermissions()) {
  if (permission && !publicPermissions.some(([key]) => key === permission)) return false;
  return hasPermission(role, subAdminId, "publicWebsite", permissions)
    && (!permission || hasPermission(role, subAdminId, permission, permissions));
}

export function hasPermission(role, id, key, permissions = readAdminPermissions()) {
  if (role === "admin") return true;
  return role === "subadmin" && subAdmins.some(person => person.id === id && person.status === "Active")
    && permissions[id]?.[key] === true;
}

export function canAccessSubAdminRoute(pathname, permissions, id = currentSubAdminId) {
  const page = pathname.replace(/\/+$/, "").split("/")[2];
  if (["dashboard", "notifications", "profile", "permissions", "settings", "logout"].includes(page)) return true;
  const permission = operationalPermissions.find(([key, , route = key]) => route === ({ categories: "courses", reviews: "reports", "audit-logs": "reports" }[page] || page));
  return !!permission && hasPermission("subadmin", id, permission[0], permissions);
}
