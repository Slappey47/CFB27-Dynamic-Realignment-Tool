Slappey's Dynamic Conference Realignment Tool. - V0.2

CFB27 allows for manual conference realignment, but for me it has felt hollow without gamifying it. This is a companion app designed to add movement to conferences in Dynasty mode. 


## About:

- This tool is designed to generate realignment moves based on realistic factors. (Team Prestige, Geography, and Conference Tenure)
- In order to generate movement, this tool also gives conferences the ability to kick out teams that are underperforming. While this is unrealistic, this is necessary to create room in the power conferences for teams
- This tool is designed to be run during the offseason (it should be run first in the preseason/season. afterwards it should be run during offseason). It will read your save file, and spit out realignment moves. 
- For now, this tool is designed for the user to input those moves through the manual custom conferences editor. Direct save editing may be added in the future
- Two ways to run the engine. "Slow realignment" and "Full Realignment Cycle". Read more about the difference below
- This tool is built off of balla14's pipeline tool. I just  swapped out the guts, so I wanted to give them a shout out here, this wouldn't be possible without their help.
- This is my first time creating a mod or tool, and it is also my first time creating an Electron app. I appreciate all your feedback, I'm sure I've screwed something up.


## Download and Setup

**Easiest option (recommended):** download the latest `.zip` from
[Releases], extract it, and double-click `Dynamic Recruiting Pipeline
Tool.exe` inside the extracted folder. **No Node.js or any other install
needed** -- everything the app needs (including its own Node.js runtime)
is bundled inside the exe already. Keep the exe inside its extracted
folder; it depends on the other files sitting next to it.

> **Windows may show a "Windows protected your PC" warning** the first
> time you run this -- that's normal for any small unsigned app like this
> one, not a sign of an actual problem. Click **More info** -> **Run
> anyway** to continue.

**Building/running from source instead:** this path *does* require
Node.js installed on your machine (only the packaged exe above is
self-contained).
```
npm install
npm start
```
Or on Windows, double-click `start.bat`, which runs `npm install`
automatically on first launch.


## When To Use
- When running this tool for the first time (during a new or existing dynasty), run it ASAP durint the preseason or season
- Afterwards, run the tool every offseason, during the week when you're allowed to customize conferences

## How To Use - Workflow

1. **Create your save** -- Inside CFB 27, make sure you've created a save that can be read by the tool
2. **Open your save** -- With the tool open, select your dynasty save file directly. That's it,
   no exports.
3. **Settings** -- You can change the tool's settings to customize youyr experience. These settings are remembered after you close the tool. You can find more info on what each setting does below. Note: you can change settings -> run engine -> repeat to help dial in your settings. Running the engine again on the same save will overwrite the previous run.
4. **Run engine** -- This reads every team's prestige rating, current conference, and more straight from the save. This calculates realignment interest and realignment moves once that interest is strong enough. There are two methods to run the engine. You can read more about the differences below
5. **Review** -- Review the status of conference realignment. This shows realignment from the perspectives of conferences. You can see conference additions, conference expulsions, and interest levels to give you a sneak peek at what moves conferences are considering for the future
6. **Apply** -- This tool does not edit your save file. Use the in-game custom conferences menu to apply changes.

## 2 Ways to Run the DCR engine


Slow Realignment is default way to use this tool.

Full Realignment Cycle (FRC) can be used whenever you want, but it was developed with the following situations in mind.

1. Settings Testing - It can be difficult to determine the impact of sliders with one run of the slow realignment engine. FRC gives a broader overview of the impact of your settings changes. You're not locked into using FRC either. You can run FRC as much as you want to tweak settings. Once you're satisfied, you can run Slow Realignment and move forward that way
2. Generate custom conferences - FRC can be used to generate custom conferences for the start of a brand new dynasty. Because custom conferences happen durring the dynasty setup process, this is a bit tricky. First, create a new dynasty, this is temporary throwaway. Get to a point where you can create a manual save point, and do so. Now, you can run an FRC on that save file. Create a second dynasty, this time, this is your real dynasty. Use the cusotm conferences screen in the setup menu to implement the tool's recommendations. When 
3. "Burst" realignment - FRC can be run anytime you want a burst of realignment, it's up to you. Here's some examples, but you can do more than just this
- FRC every X seasons, slow realignment in between
- FRC every X seasons, no realignment in between (Note: in this case, I recomend running slow realignment anyways to record team Prestiges. Simply ignore the tool's recommendations.) 
- FRC just because, when you've been bored of slow realignment 
- FRC every single offseason, because you want maximum chaos


## Settings overview

**Category 1: Realignment Factors**

These sliders change how much certain aspects are considered in realignment calulations

- Prestige
- Geography
- Tenure - The more years a team spends in a conference, the more attached they will be to each other
- Stability - This impacts how willing conferences are to make moves, and how easy it is for conferencese to gain interest in making moves
- Desired size - This changes how strongly conferences will try to stay at their desired size (Note: in v0.1, this is hardcoded that p4 conferences want 16 teams and g6 conferences want 12 teams. This may be something I expose as a setting in a future release)
- Even / Odd  - This change how strongly conferences will try to stay at an even number

**Category 2: Realignment Pace**

- Process Length - This is how many years it takes to go from "Conference is interested" to a potential conference invite (the same is true for expulsions)
- Prestige history - This controls how many years of prestige are tracked. Prestige can yo-yo, this limits the impact of that. Note that the Prestige History automatically has decay applied. Prestige ratings are worth less as they get older.
- Expedite Fees - The invite/expel process can be shortcut if the conference wants it badly enough. Increasing this slider will make that happen less often

**Category 3: Miscellaneous**

- Moratorium Period - This controls how many years must elapse before conferences are allowed to make moves. Setting this to 0 is not recomended.
- Hawai'i Bonus - This tool has a feature to simulate the Hawai'i rule. This makes them more attractive to conferences, to balance out the impact of their geography. This slider adjusts the strength of this bonus.
- P4 Conference Size - This slider changes the target conference size for the P4 conferences
- G6 Conference Size - This slider changes the target conference size for the G6 conferences
- Pac-12 Conference Size - This slider changes the target conference size for the Pac-12. By default, the tool groups the Pac-12 with the other G6 conferences. But, with many folks nostalgic for the P5 version of the Pac-12, this can be set independently.
- Notre Dame locked an independent? - unchecking this will allow Notre Dame to join a conference


