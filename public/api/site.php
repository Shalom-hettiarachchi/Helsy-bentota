<?php
// GET /api/site.php – rooms, rates, seasons, menu and contact details for the website.
require __DIR__ . '/lib/bootstrap.php';

require_method('GET');
json_out(public_site_data());