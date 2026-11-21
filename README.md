# Kevin’s Cookie Shop Tycoon

Open `index.html` in any modern browser. No install, build, internet connection, or account is required.

Alternatively, from this folder run `python3 -m http.server 8000` and open http://localhost:8000.

Start with $100 and manage 30 days. Choose cookies to bake, a price, and advertising, then open your shop. Cookies cost $0.50 each; baking and advertising are paid upfront. Daily foot traffic, price, advertising, and a small random variation determine demand. Unsold cookies are donated at closing. There are no hidden expenses. You can take a day off by baking zero cookies and spending zero on ads.

Review each day’s sales and finances, then plan the next day. After 30 days, see how much your shop earned. Progress saves automatically in this browser when local storage is available. Use **New game** to reset it. Local-file storage behavior varies by browser; use the local server for a consistent origin.

Opening the shop starts a short animated customer rush: customers walk to the door, buy little batches, and leave with cookies. Larger sales bring more visitors (up to 18), while the purchase counter tracks all cookies sold. Choose **See results** to skip ahead. Reduced-motion preferences show results without the customer animation. Sales save before the animation starts, so reloading cannot replay a day's earnings.

Files: `index.html` (interface), `style.css` (responsive styling and animations), `game.js` (game rules), `customers.js` (customer rush), `app.js` (interaction and saves).

Run `node test.js` for game-rule checks and `node test-customers.js` for animation lifecycle and interaction checks if Node.js is installed. The interaction checks use a DOM stand-in; they do not verify visual rendering.
