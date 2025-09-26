# Paths of Glory Combat Results Calculator

This single-page web app reproduces the combat odds tables from *Paths of Glory* and walks through every possible die roll to show how likely each outcome is. Pick the fire tables, apply trench and terrain shifts, add combat card modifiers, and the calculator responds with probability summaries that match the board game rules.

## Features
- Attacker and defender inputs for corps or army fire tables, column selection, and combat card modifiers
- Terrain and trench level adjustments, plus an option to neglect trenches when the attacker is eligible
- Instant summaries for expected losses, net swing, and win/draw chances for both sides
- Probability tables for attacker losses, defender losses, and the net result, alongside the full 6x6 outcome grid
- Pure HTML/CSS/JavaScript implementation that runs locally or from GitHub Pages with no build step

## Getting Started
- Clone or download this repository: `git clone https://github.com/ampercival/pog_combat_calc.git`
- Open `index.html` in any modern browser (Chrome, Edge, Firefox, or Safari)
- Optional: use a "live server" extension while editing to auto-refresh changes

## Usage
1. Choose Army or Corps tables for both sides and select the correct combat column.
2. Enter combat card modifiers, terrain type, and the defender's trench level; toggle "Attacker can neglect trenches" when applicable.
3. Click **Calculate combat results** to update the summaries and probability tables.
4. Review the expected losses, probability breakdowns, and the complete 36-outcome grid to support your play decisions.

## Project Structure
```
.
|- index.html      # Layout and markup for the calculator
|- script.js       # Combat logic and probability calculations
|- style.css       # Theming and layout styles
```

## Calculation Notes
- Combat results are stored in lookup tables that mirror the official game charts for corps and army fire.
- Every combination of 2d6 rolls (36 outcomes) is evaluated, then aggregated into loss distributions and net results.
- Shifts from terrain, trenches, and combat cards adjust the base column before results are read.
- Summary percentages and expected values are derived from those 36 outcomes, so the display mirrors over-the-board play.

## Development
The project is framework-free; edit `index.html`, `script.js`, or `style.css` and refresh the browser to see changes. Feel free to fork and extend it with additional scenarios, alternate rule variants, or UI enhancements.

## License
Site content is shared under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) license, matching the in-app notice. Credit "Paths of Glory Combat Results Calculator" when reusing the material for non-commercial projects. *Paths of Glory* and its combat tables remain trademarks and copyrights of GMT Games.

## Acknowledgements
Inspired by Ted Racier's *Paths of Glory* and the broader community of players refining combat heuristics for the game. Thanks to GMT Games for publishing the design.
