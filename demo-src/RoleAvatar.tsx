// Reuse the actual dashboard component; avatar-adapter.mjs changes its asset
// base to ./avatars during the native demo build. No separate role/UI logic.
export { RoleAvatar } from '@dashboard/components/RoleAvatar.tsx';
export type { RoleAvatarProps } from '@dashboard/components/RoleAvatar.tsx';
