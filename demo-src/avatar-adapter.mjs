// Native dashboard components now render portraits themselves. Do not inject
// JSX into callers: repeat builds must not add duplicate portraits or imports.
// Existing compiled demos can simply receive new PNGs; no rebuild is required.
export function withRolePortraits(source, relative) {
  if (relative.replaceAll('\\', '/') !== 'components/RoleAvatar.tsx') return source;
  // build.mjs may already have made /branding/ relative before this adapter runs.
  const anchor = /const AVATAR_BASE_PATH = "(?:\/branding\/agents|\.\/branding\/agents|\.\/avatars)";/g;
  if ([...source.matchAll(anchor)].length !== 1) {
    throw Error(`Avatar base-path anchor changed: ${relative}; inspect the native RoleAvatar component.`);
  }
  return source.replace(anchor, 'const AVATAR_BASE_PATH = "./avatars";');
}
