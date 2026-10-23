// Starting content for rooms, rates, seasons, menu and contact details. The
// same file seeds the database on the server, and pages show it until the
// live version (edited in the admin panel) has loaded from /api/site.php.
import raw from '../../public/api/lib/defaults.json'

export const defaultSiteData = {
  settings: raw.settings,
  rooms: raw.rooms.map((r, i) => ({ id: i + 1, ...r })),
  seasons: raw.seasons,
  menu: raw.menu.map((c, i) => ({ id: i + 1, ...c })),
}
