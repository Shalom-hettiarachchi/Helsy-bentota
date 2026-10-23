// Pete's Meats product range. `image` is the cooked/plated photo, `packaged`
// is the photo that slides in on hover. `onPetesPage: false` hides an item
// from the Pete's Meats showcase (it still appears in the shop).

const img = (file) => `/images/product-imgs/${file}`
const pack = (file) => `/images/product-imgs/packaged/${file}`

const items = [
  {
    id: 'cumberland-sausage',
    name: 'Cumberland Sausage',
    description: 'Traditional coiled sausage with a peppery kick and aromatic sage.',
    price: 'Rs. 2,850 - 500g',
    image: img('cumberland-sausage.webp'),
    packaged: pack('cumberlandsausage.webp'),
  },
  {
    id: 'chicken-sausage',
    name: 'Chicken Sausage',
    description: 'Chicken meat 98%, pepper and salt 2%. No added cereal binder or breadcrumbs.',
    price: 'Rs. 2,900 - 500g',
    image: img('chicken-sausages.webp'),
    packaged: pack('chickensausage.webp'),
  },
  {
    id: 'smoked-bacon',
    name: 'Smoked Bacon',
    description: 'Cured back bacon, smoked.',
    price: 'Rs. 3,500 - 500g',
    image: img('smoked-bacon.webp'),
    packaged: pack('smokedbacon.webp'),
  },
  {
    id: 'cooked-ham',
    name: 'Cooked Ham',
    description: 'Tender, pre-cooked ham slices, perfect for sandwiches or salads.',
    price: 'Rs. 1,320 - 200g',
    image: img('cooked-ham.webp'),
    packaged: pack('cookedham.webp'),
  },
  {
    id: 'beef-steak-pie',
    name: 'Beef Steak Pie',
    description: 'A rich and hearty pie filled with tender beef steak in a beef stock gravy.',
    price: 'Rs. 1,100',
    image: img('beef-steakpies.webp'),
    packaged: pack('beefsteak.webp'),
  },
  {
    id: 'beef-steak-kidney',
    name: 'Beef Steak and Kidney',
    description: 'A classic British pie with diced beef steak and kidney in a rich gravy.',
    price: 'Rs. 1,100',
    image: img('beef-kidney.webp'),
    packaged: pack('beefandkidney.webp'),
  },
  {
    id: 'beef-mince-onion',
    name: 'Beef Mince and Onion',
    description: 'A comforting pie filled with seasoned minced beef and onions.',
    price: 'Rs. 1,100',
    image: img('minceandonion.webp'),
    packaged: pack('beefandonion.webp'),
  },
  {
    id: 'chicken-pie',
    name: 'Chicken Pie',
    description: 'Pastry filled with seasoned chicken in a chicken stock gravy.',
    price: 'Rs. 1,100',
    image: img('chicken-pies.webp'),
    packaged: pack('chickenpie.webp'),
  },
  {
    id: 'pork-pie',
    name: 'Pork Pies',
    description: 'A traditional British meat pie with seasoned pork filling in a crispy pastry.',
    price: 'Rs. 800',
    image: img('pork-pie.webp'),
    packaged: pack('porkpies.webp'),
  },
  {
    id: 'beef-burger',
    name: 'Beef Burger (100g)',
    description:
      'A rich and hearty burger made of 98% beef, 2% pepper, salt, onion seasoning with no added filler.',
    price: 'Rs. 3,000 - Qty 5',
    image: img('beef-burger.webp'),
    packaged: pack('beefburger.webp'),
  },
  {
    id: 'chicken-burger',
    name: 'Chicken Burger (100g)',
    description: 'A tender and flavourful ground chicken burger with no added filler.',
    price: 'Rs. 3,000 - Qty 5',
    image: img('chiken-burger.webp'),
    packaged: pack('chickenburger.webp'),
  },
  {
    id: 'sausage-rolls',
    name: 'Sausage Rolls',
    description: 'Flaky pastry wrapped around seasoned sausage meat.',
    price: 'Rs. 2,000 - Qty 4',
    image: img('sausage-rolls.webp'),
    packaged: pack('sausagerolls.webp'),
  },
  {
    id: 'scotch-eggs',
    name: 'Scotch Eggs',
    description: 'Boiled eggs encased in either pork or chicken sausage meat.',
    price: 'Rs. 550',
    image: img('scotcheggs.webp'),
    packaged: pack('dsc09603.webp'),
  },
  {
    id: 'potato-chips',
    name: 'Potato Chips',
    description:
      'Hand cut Nuwara Eliya potatoes, semi cooked, to be fried in hot oil until brown and crispy.',
    price: 'Rs. 2,400 - 1kg',
    image: img('chips.webp'),
    packaged: pack('potatochips.webp'),
  },
  {
    id: 'blueberry-turnover',
    name: 'Pear and Blueberry Turnover',
    description: 'A flaky pastry filled with sweet blueberry filling.',
    price: 'Rs. 400',
    image: img('blueberry-turnover.webp'),
    packaged: pack('blueberryturnover.webp'),
    onPetesPage: false,
  },
  {
    id: 'pork-liver-pate',
    name: 'Pork Liver Pate',
    description: 'Rich, smooth, and flavourful spread made from premium pork liver.',
    price: 'Rs. 1,800 - 180g',
    image: img('liver-pate.webp'),
  },
  {
    id: 'lard',
    name: 'Lard',
    description: 'Pure, high-quality pork fat for baking, frying, and cooking.',
    price: 'Rs. 1,600 - 1kg',
    image: img('lard.webp'),
  },
]

// Shop filter groups
export const categories = [
  { id: 'sausages', label: 'Sausages & Bacon' },
  { id: 'pies', label: 'Pies & Pastries' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'pantry', label: 'Pantry' },
]

const categoryOf = {
  'cumberland-sausage': 'sausages',
  'chicken-sausage': 'sausages',
  'smoked-bacon': 'sausages',
  'cooked-ham': 'sausages',
  'beef-steak-pie': 'pies',
  'beef-steak-kidney': 'pies',
  'beef-mince-onion': 'pies',
  'chicken-pie': 'pies',
  'pork-pie': 'pies',
  'sausage-rolls': 'pies',
  'scotch-eggs': 'pies',
  'blueberry-turnover': 'pies',
  'beef-burger': 'burgers',
  'chicken-burger': 'burgers',
  'potato-chips': 'pantry',
  'pork-liver-pate': 'pantry',
  lard: 'pantry',
}

export const products = items.map((p) => ({ ...p, category: categoryOf[p.id] ?? 'pantry' }))

export const findProduct = (id) => products.find((p) => p.id === id)
