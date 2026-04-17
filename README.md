# BCUnitList

A site for tracking the units and upgrades obtained in the mobile game The Battle Cats (Mainly targets the EN version, but includes units from other versions of the game).

## Features

- View a list of units in the game
  - Customize the values of the units (level, talents, ORB, etc.)
- View a specific unit
- View units by categories
  - e.g. only Gacha rare units, or only units that evolve from ancient eggs
- View the materials needed to level up and evolve units
- Filter units by various properties
  - Including a filter for "Unit exists"!
- Customize lists and behaviors via the settings
  - Wow, very exciting

Check it out at [https://goldrewamp.github.io/BCUnitList/](https://goldrewamp.github.io/BCUnitList/)

## Updating data

If for whatever reason, you need to update the unit data in your own clone of this repository, here are the files that need to be updated (all in the assets folder). Note that any ```.js``` files below are actually ```.json``` files imported as ```.js``` so that they can be accessed synchronously. If you don't know what that means, don't worry about it, just treat the files like JSON.

Very important:

- ```settings.js``` needs the correct unit count in ```unitCount```, and any unit who doesn't have a unit icon needs their id to be added to the ```skipImages``` array.
- ```units_###.csv``` and ```units_costs_###.csv``` need to have rows added containing the relevant unit information. Files are divided into groups of 100, so create a new file and copy the headers if the file reaches the next multiple of 100.
- Place all unit icons in ```img/unit_icon```, using the same naming format as in that folder.
- Add the unit ID to the correct position in ```assets/unit_data/sort_order.js``` based on their rarity and location in the unit equip menu in game. It's best to check the location in game, but if that's not possible, generally units fall into a common category based on how you get them (e.g., all egg units, or all units from a specific gacha banner), and are then ordered by ID within their category. One exception is for variants of existing units, which are placed next to the original, still ordered by ID (e.g. crazed moneko is placed next to regular moneko).

Somewhat important:

- If a unit has a unique combination of level cap and + level cap, then give a name to that combination in ```level_cap_stats.csv```, and then reference it in ```units_###.csv```.
- If a unit has a unique XP leveling curve, then give a name to the XP amounts in ```leveling_stats.csv```, and then reference it in ```unit_costs_###.csv```.
- Add the unit to any relevant categories in the category folder. You can create a collection of related categories in a new file as long as the file name is in ```types.txt```. Note that small collabs are defined as any collab without a unit obtained from the rare gacha.

Rarely important:

- If a new ability is introduced, place the image in the ```img/ability``` folder, using the same naming format as in that folder. The name must be in that format to be assigned as a talent properly.
- If a new base type is introduced, place the image(s) in the ```img/foundation``` folder, using the same naming format as in that folder. Make sure to also update ```settings.js``` in order to assign a name to the base type and increment the total type counter.
- NP costs per level in a talent are determined by a combination of the total NP cost and the max level of the talent via ```talent-np-map.js``` and ```ut-np-map.js```. If future units introduce new NP costs per level, use these files to account for them.

All other changes require modifying code (technically adding new evolution materials is supported, but the materials will not be visible on the site).

## Disclaimer

All data and images from The Battle Cats, as well as the name, brand, and any other related content, belong to PONOS Corporation. I do not make any claim of ownership for anything contained in the /assets/ folder, or any other material originally created by PONOS in the repository.

## Sources/Further Credits

<https://battlecats.miraheze.org/wiki/Battle_Cats_Wiki>

<https://thanksfeanor.pythonanywhere.com/xpcurves>

<https://mygamatoto.com>

<https://github.com/battlecatsinfo/battlecatsinfo.github.io>

<https://github.com/battlecatsultimate/BCU-java-PC> (BCU)

## Planned Features

- Mobile/vertical orientation support, better support in general for a variety of browsers and screen sizes
