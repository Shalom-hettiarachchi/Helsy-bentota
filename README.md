# The Helsy Bentota – website

Next.js site for The Helsy Bentota: the Self-Contained Upstairs Suite with online booking, care services,
the restaurant menu, Pete's Meats and an admin panel.

It is exported as **static files plus a small PHP API**, so it runs on Hostinger Single Web Hosting
(no Node.js on the server). See **[DEPLOY.md](DEPLOY.md)** for putting it live.

## Run it locally

Needs Node.js and PHP 8.1+.

```bash
npm install
npm run api      # PHP API on http://127.0.0.1:8787 (keep it running)
npm run dev      # website on http://localhost:3000 – /api is forwarded to the PHP server
```

To test the finished build exactly like the live server:

```bash
npm run build    # creates out/
npm run preview  # http://localhost:8080
```

Locally, `helsy-config.php` (in this folder, never uploaded) turns on debug mode and writes emails to
`helsy-data/mail.log` instead of sending them. The local database is `helsy-data/helsy.sqlite` – delete the
`helsy-data` folder to start fresh. The first visit to `/admin/` from your own computer asks you to create an
admin account.

## Pages

| Route          | Page                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| `/`            | Home                                                                      |
| `/stay`        | Accommodation: the suite, photos, seasonal rates, breakfast notice        |
| `/book`        | Booking: dates calendar, guests, price, guest details, confirmation       |
| `/care`        | Care services + care enquiry form                                         |
| `/menu`        | Text menu (edited in the admin panel)                                     |
| `/reservation` | Book a table                                                              |
| `/about`       | About us                                                                  |
| `/contact`     | Contact form, both emails, phone, map                                     |
| `/petes-meats` | Pete's Meats (own header and footer)                                      |
| `/products`    | Pete's Meats shop                                                         |
| `/order`       | Place an order (`/order?product=<id>` preselects one)                     |
| `/admin`       | Admin panel                                                               |

Old PHP URLs (`/Aboutus`, `/ContactUs.php`, `/Reservation`, `/PetesMeats`, …) redirect to the new pages via
`public/.htaccess`.

## Admin panel (`/admin`)

- **Dashboard** – new booking requests (confirm / decline in one click, guest is emailed), upcoming stays
- **Bookings** – search, filter, edit, add bookings taken by phone, download as CSV
- **Calendar** – month view of bookings and blocked dates; block dates for maintenance or other channels
- **Rooms & Rates** – off-season / peak rates, extra beds, description, features, photos (upload), peak
  season dates
- **Menu** – add, edit, hide and reorder sections and dishes
- **Messages** – contact, care enquiries, table bookings and Pete's orders
- **Settings** – booking phone and contact person, website emails, notification emails, breakfast notice,
  check-in/out times, minimum nights, password, other admins

## How booking works

1. The guest picks dates on `/book`; booked or blocked nights can't be chosen.
2. The price is worked out per night: peak season nights (12 Dec – 11 Apr and July–August by default) use the
   peak rate, all other nights the off-season rate. All rates include breakfast.
3. The guest sends a **request** (no online payment). The server re-checks the dates and price, saves it as
   *pending* and emails both owners and the guest.
4. An admin confirms or declines it; the guest gets an email either way. Pending and confirmed bookings both
   hold their dates.

## Where things live

- `public/api/` – PHP API (`site.php`, `availability.php`, `book.php`, `message.php`, `admin.php`, `file.php`)
- `public/api/lib/` – database, pricing, email (PHPMailer), and `defaults.json` (starting rooms, rates, seasons,
  menu and contact details – used to fill the database on first run)
- `src/components/booking/` – booking calendar and booking steps
- `src/components/admin/` – admin panel
- `src/hooks/useSiteData.js` – loads live rates, menu and contact details from the API
- `src/lib/pricing.js` – seasonal pricing (same rules as `public/api/lib/pricing.php`)
- `src/data/site.js` – address, social links, navigation; `src/data/care.js` – care services text
- `public/images/` – images. After adding one used with `<Img>`, add its width/height to
  `src/data/image-sizes.json`.
