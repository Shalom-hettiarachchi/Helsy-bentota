# Putting the site live on Hostinger (Single Web Hosting)

The website is plain HTML/CSS/JS plus a small PHP API in `/api`, so it runs on
Hostinger's basic shared hosting. **No Node.js is needed on the server.**

Needs: PHP **8.1 or newer** with `pdo_sqlite` (Hostinger has this on by default).

---

## 1. Build the site (on your computer)

```bash
npm install
npm run build
```

This creates the `out/` folder – that folder **is** the website.

## 2. Back up and clear the old site

1. hPanel → **Files → File Manager** → open `public_html`.
2. Select everything → **Compress** → download the zip as a backup.
3. **Keep Google's verification:** before deleting, look for a file named like
   `google1234abcd.html` in `public_html`, or a
   `<meta name="google-site-verification" content="…">` line in the old
   `index.php`/`header.php`. Save it – step 9 needs it.
4. Delete the old files from `public_html`.

> ⚠️ The old site's PHP files contain the Gmail app password in plain text.
> After deleting them, **revoke that app password** in the Google account
> (myaccount.google.com → Security → App passwords) and create a new one if you
> want to keep sending through Gmail.

## 3. Upload the new site

1. Zip the **contents** of `out/` (not the folder itself). Make sure the hidden
   files `.htaccess` and `api/.htaccess` are included.
2. In File Manager, upload the zip into `public_html` and **Extract** it there.
3. `public_html` should now contain `index.html`, `_next/`, `api/`, `images/`,
   `stay/`, `book/`, `admin/` … and `.htaccess`.

## 4. Create the private config file

The config lives **one folder above `public_html`**, so it is never public and
never overwritten when you re-upload the site. On Hostinger that folder is
usually `/home/u123456789/domains/thehelsybentota.com/`.

1. In File Manager go one level up from `public_html`.
2. Create a file named **`helsy-config.php`**.
3. Paste the contents of `public_html/api/config.sample.php` and fill in:
   - `setup_key` – any long random phrase (used once, in step 5).
   - Email (`mail` → `smtp`). Recommended: create a Hostinger mailbox such as
     `bookings@thehelsybentota.com` (hPanel → Emails) and use
     `smtp.hostinger.com`, port `465`, `ssl`. Gmail also works with
     `smtp.gmail.com` and a **new** app password.

The database (SQLite file), uploaded photos and logs are created automatically
in a `helsy-data` folder next to `helsy-config.php`.

*Prefer MySQL?* Create a database in hPanel → Databases and fill in the `db`
section of the config. Tables are created automatically.

## 5. Create the admin account

1. Open `https://www.thehelsybentota.com/admin/`.
2. Fill in your name, email and a password (10+ characters), plus the
   **setup key** from step 4.
3. You're signed in. You can now delete the `setup_key` line from the config.

Add other people (e.g. Peter) in **Admin → Admins**.

## 6. Check the settings

In the admin panel:

- **Settings** – booking phone number, contact person, the two email addresses
  (shown on the site / receive bookings), check-in and check-out times.
- **Rooms & Rates** – off-season and peak rates, extra bed price, photos.
- **Rooms & Rates → Peak season dates** – already set to 12 Dec – 11 Apr and
  1 Jul – 31 Aug.
- **Menu** – edit, hide or reorder dishes.

## 7. Turn on HTTPS

hPanel → **Security → SSL** → make sure the certificate is active and turn on
**Force HTTPS**.

## 8. Test it

1. Make a test booking on `/book/` with your own email.
2. Check both notification emails arrive (and the guest confirmation).
3. Confirm it in the admin panel – the guest gets a "confirmed" email.
4. Delete the test booking.

If emails don't arrive, look at `helsy-data/error.log` (one level above
`public_html`).

## 9. Google Search Console

Keeps the site's Google history and tells Google about the new pages.

1. **Verification** (from step 2):
   - a `google….html` file → copy it into the `public/` folder of the project,
     run `npm run build` again and re-upload; or
   - a meta tag → paste its `content` value into `googleSiteVerification` in
     `src/data/site.js`, rebuild and re-upload.
   - Found neither? In Search Console choose **Add property → URL prefix**,
     pick **HTML tag**, and use that code the same way.
2. In [Search Console](https://search.google.com/search-console) open the
   property for `https://www.thehelsybentota.com/` → **Sitemaps** → enter
   `sitemap.xml` → **Submit**.
3. Use **URL inspection** on the home page → **Request indexing**.
4. Old addresses (`Menu.php`, `Reservation.php`, `ContactUs.php` …) already
   redirect to the new pages, so existing Google results keep working.

---

## Updating the website later

Run `npm run build` again and upload the new `out/` contents to `public_html`
(replace files). Bookings, settings, menu, photos and the config are stored
outside `public_html`, so they are not affected.

## Backups

Hostinger makes automatic backups. For an extra copy, download
`helsy-data/helsy.sqlite` from File Manager now and then – it holds every
booking, message, rate, menu item and setting.
