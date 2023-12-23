      ┌───────────────┐
      │ background.js │ i.
      └───┬───────▲───┘
          │       │ 
          │       │ iii.
iv. ┌─────▼───────┴─────┐ 
    │     globals.js    │
    │  ┌─────────────┐  │
    │  │ content.js  │  │ ii.
    │  └─────────────┘  │
    │  ┌─────────────┐  │
    │  │ helpers.js  │  │
    │  └─────────────┘  │
    │  ┌─────────────┐  │
    │  │ sidebar.js  │  │
    │  └─────────────┘  │
    │  ┌─────────────┐  │
    │  │  etc. etc.  │  │
    │  └─────────────┘  │
    └───────────────────┘

i.   The background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction.
ii.  The content.js file is responsible for injecting or modifying the content of web pages that you visit
iii. Each domain has certain permissions e.g. tab creation, instantiation of local storage keys etc, and so sending messages from your content domain to your background domain is necessary.
iv.  The order in which these files are added to the manifest.json in the project root directory does not affect the functioning of global variables in globals.js. The above is merely a general schema.
v. functions using the syntax `! function alias(){...}();` automatically execute on startup.
