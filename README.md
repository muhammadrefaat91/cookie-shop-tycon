# Kevin’s Cookie Shop Tycoon

Open `index.html` in any modern browser. No install, build, internet connection, or account is required.

Alternatively, from this folder run `python3 -m http.server 8000` and open http://localhost:8000.

Start with $100 and manage 30 days. Choose one recipe from **Today’s cookie variety**, decide how many cookies to bake, set the selling price, and choose your advertising budget. The dropdown updates the baking cost and starts the price at that recipe’s suggested price; you can adjust it before opening. Baking and advertising are paid upfront.

| Variety | Cost to bake | Suggested selling price |
| --- | --- | --- |
| Chocolate chip | $0.50 | $2.00 |
| Oatmeal raisin | $0.70 | $2.50 |
| Double chocolate | $0.90 | $3.00 |

Bake one variety for the whole day, or set the batch to zero to take a day off. Only the selected variety is baked and sold. Higher prices reduce demand. Daily foot traffic, advertising, and a small random variation also determine demand. Advertising is charged once for the day. Unsold cookies are donated at closing. There are no hidden expenses. You can take a day off by setting the batch and advertising to zero.

Review daily totals and the recipe-by-recipe sales, baking costs, revenue, and margin, then plan the next day. Recipe margin excludes the shared advertising expense; daily profit includes it. The daily ledger shows the average price of cookies actually sold, with expandable recipe details for every previous day. After 30 days, see how much your shop earned. Progress saves automatically in this browser when local storage is available. Use **New game** to reset it. Local-file storage behavior varies by browser; use the local server for a consistent origin.

Opening the shop starts a short animated customer rush: customers walk to the door, buy little batches, and leave with cookies. Larger sales bring more visitors (up to 18), while the purchase counter tracks all cookies sold. Choose **See results** to skip ahead. Reduced-motion preferences show results without the customer animation. Sales save before the animation starts, so reloading cannot replay a day's earnings.

Files: `index.html` (interface), `style.css` (responsive styling and animations), `game.js` (game rules), `customers.js` (customer rush), `app.js` (interaction and saves).

Run `node test.js` for game-rule checks and `node test-customers.js` for animation lifecycle and interaction checks if Node.js is installed. The interaction checks use a DOM stand-in; they do not verify visual rendering.

Existing single-cookie saves migrate to chocolate-chip history automatically, retaining the day, cash, and previous results. The selected variety, batch, price, and advertising draft save while planning. New days carry forward the last variety and price, reducing the batch if needed to fit available cash; advertising starts at zero. Previous mixed-menu results remain available in the ledger.
