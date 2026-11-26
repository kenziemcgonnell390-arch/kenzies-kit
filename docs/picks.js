/* ==========================================================================
   THE ONLY FILE YOU NEED TO EDIT.

   Everything the page shows comes from here: your name, the categories, the
   picks, and the links. Change a line, save, refresh the page.

   RULE FOR THIS PAGE: every pick earns. Only list things with an affiliate or
   referral programme you can join, so that every link on the page can carry
   one. Nothing here recommends a free alternative, and nothing here is a piece
   of advice with no product behind it.

   The picks below are STARTING ENTRIES chosen because their programmes are
   open to anyone. Paste your link into each `url` as you get accepted. A pick
   with an empty url still renders, showing "link coming" instead of a button,
   so you can fill them in over time without the page looking broken.

   Fields on a pick:
     id     short unique word. Keep it stable.
     cat    which category it belongs to (must match a category id below)
     name   what it is called
     what   one plain line: what it is
     why    one plain line: why it is on the list
     price  "Subscription" | "One-off" | "Paid plan" | "Free to open" | "Free to join"
            (the last two are for referral signups: free to them, paid to you)
     band   "cheap" | "mid" | "dear"   (used by the budget filter)
     fits   which situations it suits: student, trading, building, browsing
     url    your affiliate link. Empty string is fine.

   The first pick in each category is the one the page leads with when a
   visitor has not answered the questions, so put your strongest one first.

   To see the page as it will look once every link is in, open it with
   ?preview on the end of the address. The buttons show but go nowhere.

   Where to find the programmes: most are listed at <brand>.com/affiliates, and
   the gear category runs on Amazon Associates.
   ========================================================================== */

window.KIT = {

  site: {
    name: "The Pegboard",
    /* The first screen has three jobs: say who this is for, say what they get,
       and give them one thing to do. The headline is the question they arrived
       with, the tagline names them and the result, and `cta` is the button. */
    headline: "Which tools are actually worth paying for?",
    tagline: "Studying, trading, or building something on the side? Answer two questions and get a short list picked for you.",
    cta: "Show my kit",
    /* The short form of the disclosure, shown beside the first button. */
    disclosureShort: "Every link here is an affiliate link or something I made. Either way I earn from it, at no extra cost to you.",
    /* Required by law in the UK and most other places. Keep it visible. */
    disclosure: "Every link on this page is an affiliate link, apart from the Sole Trader Tax Kit, which I made and sell myself. If you buy through one, I earn from it at no extra cost to you. It is how the page pays for itself. It doesn't decide what gets listed: each pick is here because it's worth the money.",
    contact: "kenziemcgonnell390@gmail.com",
    reviewed: "September 2026"
  },

  /* The first question the page asks. */
  situations: [
    { id: "student",  label: "Studying",        note: "Coursework, exams, notes that survive the year." },
    { id: "trading",  label: "Trading",         note: "Charts, journals, and a record you can trust." },
    { id: "building", label: "Building things", note: "Writing, shipping, earning something of your own." },
    { id: "browsing", label: "Just looking",    note: "No particular plan. Show me the good bits." }
  ],

  /* The second question. Three levels of spend, no free tier: everything on
     this page is something you pay for. */
  budgets: [
    { id: "lean", label: "Keep it lean",   allows: ["cheap"] },
    { id: "mid",  label: "Somewhere sane", allows: ["cheap", "mid"] },
    { id: "best", label: "Best available", allows: ["cheap", "mid", "dear"] }
  ],

  categories: [
    { id: "trading",  name: "Trading",       line: "Charting, journalling, and the boring parts that decide whether the rest works." },
    { id: "study",    name: "Study",         line: "Getting through a semester without losing the notes you made in week two." },
    { id: "software", name: "Software & AI", line: "The subscriptions worth having running in the background of your day." },
    { id: "money",    name: "Money",         line: "Where the money sits when it is not in a trade." },
    { id: "side",     name: "Side income",   line: "The stack behind anything you sell on the internet." },
    { id: "desk",     name: "Desk & gear",   line: "Physical objects. Bought once, used every day, replaced rarely." }
  ],

  /* VOICE RULE. Recommending is fine ("What I'd pick"); claiming personal
     use is only allowed for products Kenzie actually uses. Picks are written
     as why each one is worth paying for. If you use one, you can make its
     line personal. There is no investing account on the page on purpose:
     see the note in the README. */
  picks: [
    /* ---------------------------------------------------------- trading -- */
    { id: "tradingview", cat: "trading", name: "TradingView",
      what: "Charts in the browser, with alerts, screeners and replay.",
      why: "The paid tiers are the ones worth having: more alerts, more indicators per chart, and no ads in the way.",
      price: "Subscription", band: "cheap", fits: ["trading", "browsing"], url: "" },

    { id: "journal", cat: "trading", name: "TradeZella",
      what: "Software that logs every trade and shows you what your edge actually is.",
      why: "Shows you which setups are carrying your account and which ones are quietly costing you.",
      price: "Subscription", band: "mid", fits: ["trading"], url: "" },

    { id: "propfirm", cat: "trading", name: "FTMO Challenge",
      what: "A firm that gives you capital to trade once you pass their evaluation.",
      why: "The fastest route to size if your strategy already has months of results behind it. The evaluation fee is the whole cost.",
      price: "One-off", band: "dear", fits: ["trading"], url: "" },

    { id: "newsfeed", cat: "trading", name: "Benzinga Pro",
      what: "Headlines and squawk that reach you before they reach your feed.",
      why: "Worth it the first morning it gets you out of something ten minutes early.",
      price: "Subscription", band: "dear", fits: ["trading"], url: "" },

    /* ------------------------------------------------------------ study -- */
    { id: "coursera", cat: "study", name: "Coursera Plus",
      what: "University courses and certificates, one subscription for the lot.",
      why: "Better value than buying courses one at a time, and the certificates are from institutions people have heard of.",
      price: "Subscription", band: "mid", fits: ["student", "building"], url: "" },

    { id: "grammarly", cat: "study", name: "Grammarly Premium",
      what: "Checks tone, clarity and structure, not just spelling.",
      why: "The rewrite suggestions are the part worth paying for. They catch things a quick proofread misses.",
      price: "Subscription", band: "cheap", fits: ["student", "building"], url: "" },

    { id: "notion", cat: "study", name: "Notion Plus",
      what: "Notes, tables and pages that link to each other, with unlimited history.",
      why: "The paid plan is where the version history and file limits stop getting in your way mid-semester.",
      price: "Paid plan", band: "cheap", fits: ["student", "building"], url: "" },

    { id: "audible", cat: "study", name: "Audible",
      what: "Audiobooks, including most of the finance and business shelf.",
      why: "Turns a walk to campus into the bit of reading you were not going to do anyway.",
      price: "Subscription", band: "cheap", fits: ["student", "browsing"], url: "" },

    /* --------------------------------------------------------- software -- */
    { id: "vpn", cat: "software", name: "NordVPN",
      what: "Encrypts your connection and lets you choose where it comes out.",
      why: "Campus and cafe wifi are not yours. This is the cheapest thing on the page that removes a real risk.",
      price: "Subscription", band: "cheap", fits: ["student", "trading", "building", "browsing"], url: "" },

    { id: "passwords", cat: "software", name: "1Password",
      what: "One vault, every device, and a different password everywhere.",
      why: "The paid family plans are worth it for the shared vault alone. Reusing passwords on a brokerage account is not a risk worth taking.",
      price: "Subscription", band: "cheap", fits: ["student", "trading", "building", "browsing"], url: "" },

    { id: "canva", cat: "software", name: "Canva Pro",
      what: "Design tool for thumbnails, slides, and anything you need to look finished.",
      why: "The brand kit and background remover are the two features you will use every week.",
      price: "Subscription", band: "cheap", fits: ["building", "student"], url: "" },

    { id: "backup", cat: "software", name: "IDrive",
      what: "Your whole drive copied somewhere that is not your flat.",
      why: "A few pounds a month against losing a year of coursework. Set it up once and forget it.",
      price: "Subscription", band: "mid", fits: ["student", "trading", "building"], url: "" },

    /* ------------------------------------------------------------ money -- */
    /* Kenzie's own product (Plain Ledger on Whop), not an affiliate link. */
    { id: "taxkit", cat: "money", name: "Sole Trader Tax Kit",
      what: "A bookkeeping spreadsheet and a weekend guide that get your self-employed tax return done.",
      why: "I made this one. Log your jobs and costs, and it hands you the figures for your Self Assessment, mileage and CIS included.",
      price: "One-off", band: "cheap", fits: ["trading", "building", "browsing"],
      url: "https://whop.com/checkout/plan_eLqvpxyD5GPxl" },

    { id: "budget", cat: "money", name: "YNAB",
      what: "A budgeting method with software attached. Every pound gets a job.",
      why: "The one that survives contact with an irregular income, which is what trading and student finance both are.",
      price: "Subscription", band: "mid", fits: ["student", "trading"], url: "" },

    { id: "cashback", cat: "money", name: "TopCashback",
      what: "Pays you a percentage back on shopping you were doing anyway.",
      why: "The sign-up bonus usually covers a month of one of the subscriptions above, and it keeps paying after that.",
      price: "Free to join", band: "cheap", fits: ["student", "browsing"], url: "" },

    { id: "tax", cat: "money", name: "Taxfix",
      what: "An accountant files your self-assessment return online, for a flat fee.",
      why: "If you'd rather not touch the return at all, an accountant does the whole thing for less than you'd expect.",
      price: "One-off", band: "mid", fits: ["trading", "building"], url: "" },

    /* ------------------------------------------------------- side income -- */
    { id: "hosting", cat: "side", name: "Hostinger",
      what: "Somewhere for your site to live, with a domain thrown in.",
      why: "The cheapest possible start for anything you want to own rather than rent from a platform.",
      price: "Subscription", band: "cheap", fits: ["building"], url: "" },

    { id: "sitebuilder", cat: "side", name: "Squarespace",
      what: "Drag-and-drop pages, checkout included, no code.",
      why: "Worth the money on day one if the alternative is spending three weekends learning CSS instead of selling.",
      price: "Subscription", band: "mid", fits: ["building", "browsing"], url: "" },

    { id: "email", cat: "side", name: "MailerLite",
      what: "Collects subscribers and sends to them without landing in spam.",
      why: "The list is the only audience you actually own. Start it before you think you need it.",
      price: "Subscription", band: "mid", fits: ["building"], url: "" },

    { id: "print", cat: "side", name: "Printful",
      what: "Prints and ships your designs when someone orders, no stock up front.",
      why: "Turns an idea into something for sale in an afternoon, with nothing in a cupboard if it flops.",
      price: "Free to join", band: "cheap", fits: ["building", "browsing"], url: "" },

    /* ------------------------------------------------------------- desk -- */
    { id: "monitor", cat: "desk", name: "Dell P2725H monitor",
      what: "A 27-inch panel with a height-adjustable stand.",
      why: "One of the biggest jumps in how much gets done at a desk. Notes on one side, work on the other.",
      price: "One-off", band: "dear", fits: ["student", "trading", "building"], url: "" },

    { id: "chair", cat: "desk", name: "Sihoo Doro C300 chair",
      what: "Adjustable height, real lumbar support, arms that get out of the way.",
      why: "You will sit in it for thousands of hours. It is the least glamorous thing here and the one worth the most.",
      price: "One-off", band: "dear", fits: ["student", "trading", "building"], url: "" },

    { id: "keyboard", cat: "desk", name: "Keychron K2 keyboard",
      what: "Switches you can feel, in a layout you can live with.",
      why: "Buy the boring one. The hobby end of this category is a hole in the ground.",
      price: "One-off", band: "mid", fits: ["building", "browsing"], url: "" },

    { id: "headphones", cat: "desk", name: "Sony WH-1000XM6",
      what: "Over-ear, wired option, battery that lasts a day in the library.",
      why: "Buys you a quiet room in a building that does not have one.",
      price: "One-off", band: "dear", fits: ["student", "building", "browsing"], url: "" },

    { id: "lamp", cat: "desk", name: "Govee light bars",
      what: "Dimmable warm light that sits behind the screen, not above it.",
      why: "Evening work stops feeling like a hospital corridor. Cheap, and you notice it the first night.",
      price: "One-off", band: "cheap", fits: ["student", "trading", "building", "browsing"], url: "" }
  ]
};
