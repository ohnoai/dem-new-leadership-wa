# Washington contact data: sources and verification

Checked **2026-11-09** (local environment date). This is an audit of the officeholders and contact routes published by primary sources, not a prediction or certification of 2026 election results or the next Congress. `data.js` is the authoritative contact dataset; this page records its evidence and limitations. Recheck membership and contact routes before launch and after a congressional transition.

## Membership and campaign routing

The live House directory supplies all ten Washington districts, party affiliations and Washington, D.C. telephone numbers.[1] The Senate directory identifies Maria Cantwell and Patty Murray as Washington Democrats.[2] The 2025 Washington Legislature reference corroborates federal numbers and identifies Bob Ferguson as a Democrat; it is an older corroborating source, not evidence of a future election outcome.[24]

`vote` is campaign routing, **not a recorded vote, pledge or scheduled ballot**: Democratic senators → `senate`; Democratic representatives → `house`; Republicans Dan Newhouse (WA-04) and Michael Baumgartner (WA-05), the governor and state party chair → `null` / `influence`. Republicans are reachable constituent representatives but are not assigned a Democratic leadership ballot. State and party offices are indirect advocacy routes, not congressional caucus voters.

## Contact and social audit

Phone numbers are official-office numbers, not personal lines. Contact routes were read without submitting forms. A retained social URL is an exact outbound `href` from the office's primary website; it verifies that the office publishes that identity, **not** that the social platform is accessible, independently authenticated, current or monitored. Legacy `twitter.com` and HTTP URLs are preserved exactly as published.

| Official | Primary-page evidence / contact result | Social evidence |
|---|---|---|
| Patty Murray | Old `/contact/` returned HTTP 404; replaced with working `/write-to-patty/`. Phone “Phone: (202) 224-2621” comes from the official home page. [3] [4] | `https://x.com/PattyMurray` [4] |
| Maria Cantwell | “You can e-mail Senator Cantwell about legislative issues from this page.” Phone “Phone: (202) 224-3441” appears in the retrieved contact page. [5] | `https://x.com/SenatorCantwell` [6] |
| Suzan DelBene | “Phone: (202) 225-6311”; ZIP-gated contact form. [7] | `https://twitter.com/RepDelBene` [7] |
| Rick Larsen | “Phone: (202) 225-2605”; contact hub links to Share Your Opinion. [8] | `https://www.facebook.com/RepRickLarsen` [8] |
| Marie Gluesenkamp Perez | “(202) 225-3536”; form verifies district residency. [9] | `https://twitter.com/RepMGP` [9] |
| Dan Newhouse | “Phone: (202) 225-5816”; `/contact` redirects to `/address_authentication?form=/contact`. [10] | No verified social link found on retrieved contact page; left empty. |
| Michael Baumgartner | Contact hub; office locations publishes “(202) 225-2006”. [12] [11] | `https://x.com/RepBaumgartner` [11] |
| Emily Randall | “(202) 225-5916”; contact hub. [13] | `https://facebook.com/RepEmilyRandall` [13] |
| Pramila Jayapal | “202-225-3106”; contact hub links to Email Me. [14] | `http://www.twitter.com/RepJayapal/` [14] |
| Kim Schrier | “(202) 225-7761”; contact hub. [15] | `https://x.com/repkimschrier` [15] |
| Adam Smith | Contact hub; D.C. phone “(202) 225-8901” confirmed in live House directory. [1] [16] | `https://twitter.com/RepAdamSmith` [16] |
| Marilyn Strickland | Contact hub; D.C. phone “(202) 225-9740” confirmed in live House directory. [1] [17] | `https://twitter.com/RepStricklandWA` [17] |
| Shasti Conrad | Party board says “Chair **Shasti Conrad**”. [18] Shared party line: “Contact us by phone: (206) 583-0664”. Not a personal chair line. [19] | No verified personal chair social link; left empty. |
| Bob Ferguson | Governor contact page; office contact page says “360-902-4111”. [21] [20] | `https://twitter.com/WaStateGov` [20] |

## Corrections and deliberate omissions

- Removed the unverified X links `https://x.com/RepRickLarsen` and `https://x.com/RepEmilyRandall`; used Facebook URLs explicitly published on their official contact pages instead. An unverified link is not proof that an account does not exist.
- Added Newhouse and Baumgartner, preserving all ten districts regardless of party. Newhouse social and Conrad personal social stay empty rather than guessing.
- Removed the duplicate Washington State Democrats organization card: Conrad already routes to the same party contact page and shared office line. This avoids treating one office as two separate outreach targets.
- Removed Perez’s undocumented `limit:2000`; no retained evidence established that character limit.
- Kept the governor as indirect influence only. His page says: “As a state official, Governor Bob Ferguson does not have any jurisdiction over the federal agencies handling issues like social security or immigration.”[20]
- The repository URL matches the Git origin. Campaign templates are separate in `campaign.js`.

## District discovery and geographic source

Step 2 suggests a district from the visitor's ZIP code using the U.S. Census Bureau's 2020 ZIP Code Tabulation Area to 119th Congressional District relationship file for Washington, [`tab20_cd11920_zcta520_st53.txt`](https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_st53.txt) (retrieved 2026-11-11 and rechecked byte-for-byte 2026-11-12): 606 ZIP areas, 78 of which cross a district line after dropping overlaps under 0.1% of a ZIP's land area. Census ZIP areas approximate postal ZIP codes, so a single match is shown as "most likely" and the full-address finder below stays one tap away. For an exact answer, use the Washington Legislature’s **full-address** [District Finder](https://app.leg.wa.gov/DistrictFinder/), select **Congressional**, and follow its boundary lookup. Its instruction is: “Enter your full address to find your legislative or congressional district.” Raw rendered HTML also labels “Map District Type:”, “Legislative” and “Congressional”.[22]

The [Secretary of State map collection](https://www.sos.wa.gov/elections/data-research/election-data-and-maps/2024-court-designated-legislativecongressional-maps) is the official geographic reference. It publishes “Washington State Legislative & Congressional Districts (front)” and links individual Congressional District 1–10 maps, including `/sites/default/files/2025-01/Congressional_District_01.pdf` through district 10. The page’s 2024 title describes the published map set, not the verification date.[23]

## Retrieval limitations

- Direct HTTP requests returned anti-bot 403 responses for WA Democrats and intermittent 503 responses for Cantwell; raw-content `web_extract` successfully returned their primary contact/board pages. No search snippet was accepted as the final evidence.
- Cantwell `/contact/office-locations` proved invalid (404 in extraction); it is not in the dataset. Her working `/contact/email` and home page supply the retained contact/social evidence.
- District Finder’s raw HTML contains a generic error fallback, but the rendered map loaded in a later browser check. A public Capitol address returned a location and legislative district; switching layers displayed congressional polygons without a verified congressional result in the text panel. See `verification.md`. The app links the official tool and official House fallback rather than claiming local district resolution.
- No calls placed, messages submitted, social logins attempted, election results inferred, or future membership asserted. Live office directories can lag real-world changes.

## Sources

[1] https://www.house.gov/representatives - Directory of Representatives
    > "Washington
District
Name
Party
Office Room
Phone
Committee Assignment
1st
DelBene, Suzan
D
2311 RHOB
(202) 225-6311"
    > "Washington
District
Name
Party
Office Room
Phone
Committee Assignment
1st
DelBene, Suzan
D
2311 RHOB
(202) 225-6311
Ways and Means
2nd
Larsen, Rick
D
2163 RHOB
(202) 225-2605
Transportation and Infrastructure
3rd
Perez, Marie
D
1431 LHOB
(202) 225-3536
Appropriations
4th
Newhouse, Dan
R
460 CHOB
(202) 225-5816
Agriculture|Appropriations|Select Comm on the Strategic Competition US and China
5th
Baumgartner, Michael
R
124 CHOB
(202) 225-2006
Education and Workforce|Foreign Affairs|Judiciary
6th
Randall, Emily
D
1531 LHOB
(202) 225-5916
Oversight and Government Reform|Natural Resources
7th
Jayapal, Pramila
D
2346 RHOB
(202) 225-3106
Budget|Foreign Affairs|Judiciary
8th
Schrier, Kim
D
1110 LHOB
(202) 225-7761
Energy and Commerce
9th
Smith, Adam
D
2264 RHOB
(202) 225-8901
Armed Services
10th
Strickland, Marilyn
D
1724 LHOB
(202) 225-9740
Armed Services|Transportation and Infrastructure"
[2] https://www.senate.gov/senators/index.htm - Senator directory
    > "Cantwell, Maria
Washington
Democratic"
    > "Murray, Patty
Washington
Democratic"
[3] https://www.murray.senate.gov - Murray office phone
    > "Phone: (202) 224-2621"
[4] https://www.murray.senate.gov/write-to-patty - Murray message form
    > "To send a message to Senator Murray, please fill out the following form:"
    > "LoA
https://www.facebook.com/senatorpattymurray/
https://www.flickr.com/photos/193902200@N08/albums
https://x.com/PattyMurray
https://www.threads.net/@senpattymurray
https://bsky.app/profile/murray.senate.gov
https://www.murr"
[5] https://www.cantwell.senate.gov/contact/email - Cantwell legislative contact
    > "You can e-mail Senator Cantwell about legislative issues from this page."
[6] https://www.cantwell.senate.gov - Cantwell official social link
    > "tagram.com/senatormariacantwell/
https://www.facebook.com/senatorcantwell/
https://x.com/SenatorCantwell
https://bsky.app/profile/cantwell.senate.gov
http://www.flickr.com/photos/"
    > "rCantwell
https://www.instagram.com/senatormariacantwell/
https://www.facebook.com/senatorcantwell/
https://x.com/SenatorCantwell
https://bsky.app/profile/cantwell.senate.gov
http://www.flickr.com/photos/mariacantwell
https://www"
[7] https://delbene.house.gov/contact - DelBene contact
    > "Phone: (202) 225-6311"
    > "485-0083
hours: M-F 8:30am-5pm
home
contact
privacy
instagram
/
https://www.facebook.com/RepDelBene
https://twitter.com/RepDelBene
https://www.youtube.com/channel/UCd00b7TpKDZIr-Ujhaktvjg
https://www.instagram.com/repdelbene/
http"
[8] https://larsen.house.gov/contact - Larsen contact
    > "Phone: (202) 225-2605"
    > "ntment only
Home
Contact
Privacy
facebook-page
bluesky-page
instagram-page
youtube-page
#main
/
#
#
https://www.facebook.com/RepRickLarsen
https://web-cdn.bsky.app/profile/did:plc:qbmfkla22voltmkf27dg4pgx
https://www.instagram.com/reprick"
[9] https://gluesenkampperez.house.gov/contact - Gluesenkamp Perez contact
    > "Washington, DC
1431 Longworth House Office Building
Washington
,
DC
20515
(202) 225-3536
Vancouver
1053 Officers Row
Vancouver
,
WA
98661
(360) 695-6292
Handicap p"
    > "ork
https://www.house.gov/representatives/find-your-representative
https://www.facebook.com/RepMGP/
https://twitter.com/RepMGP
https://www.instagram.com/repmgp/
https://www.youtube.com/@repmgp
https://www.google.com/maps/searc"
[10] https://newhouse.house.gov/contact - Newhouse contact
    > "Phone: (202) 225-5816"
[11] https://baumgartner.house.gov/contact - Baumgartner contact
    > "Contact - Michael Baumgartner"
    > "e-district/
#
#
#
https://www.facebook.com/RepBaumgartner#
https://www.instagram.com/repbaumgartner
https://x.com/RepBaumgartner
https://www.youtube.com/@RepBaumgartner
https://baumgartner.house.gov/contact/email-me
https://baum"
[12] https://baumgartner.house.gov/contact/office-locations - Baumgartner office phone
    > "hington D.C.
124 Cannon House Office Building
Washington, DC  20515
Phone: (202) 225-2006
Spokane
528 E. Spokane Falls Blvd #115
Spokane, WA  99202
Phone: (509) 353"
[13] https://randall.house.gov/contact - Randall contact
    > "DC Office
1531 Longworth House Office Building
Washington,
DC
20515
Phone:
(202) 225-5916
Tacoma District Office
1102 A Street
Suite 326
Tacoma,
WA
98402
Phone:
(25"
    > "ivacy
House.gov
Accessibility
RSS
#main-content
tel:3603739725
//randall.house.gov/contact/email-me
https://facebook.com/RepEmilyRandall
https://instagram.com/repemilyrandall
https://bsky.app/profile/repemilyrandall.bsky.social
https://"
[14] https://jayapal.house.gov/contact - Jayapal contact
    > ", DC Office
2346 Rayburn House Office Building
Washington. DC 20515
Phone: 202-225-3106
Fax: 202-225-6197
Seattle Office
2033 6
th
Ave, Suite 1011
Seattle, WA 981"
    > "with-a-federal-agency/
https://jayapal.house.gov/category/news/
http://www.facebook.com/RepJayapal/
http://www.twitter.com/RepJayapal/
http://instagram.com/repjayapal
http://www.youtube.com/repjayapal
https://jayapal.house.gov/search/"
[15] https://schrier.house.gov/contact - Schrier contact
    > "t | Representative Kim Schrier
Skip to main content
Washington D.C. Office
(202) 225-7761
About Kim
Committees and Caucuses
Issues
Our District
Accomplishments
Cont"
    > "epkimschrier
http://instagram.com/repkimschrier/
https://bsky.app/profile/repkimschrier.bsky.social
https://x.com/repkimschrier
/about
/about/committees-and-caucuses
/issues
/about/our-district
https://schrier.house.gov/accompl"
[16] https://adamsmith.house.gov/contact - Smith contact
    > "Contact | Congressman Adam Smith
Skip to main content
Contact My Office:
(425) 793"
    > "Privacy
House.gov
Accessibility
RSS
#main-content
//adamsmith.house.gov/contact
tel:(425) 793-5180
https://twitter.com/RepAdamSmith
https://www.facebook.com/RepAdamSmith
https://www.instagram.com/repadamsmith/
https://www.youtube.c"
[17] https://strickland.house.gov/contact - Strickland contact
    > "Contact - Marilyn Strickland
Skip to content
HOW CAN I HELP YOU?
Help With A Feder"
    > "icklandWA
https://www.instagram.com/repstricklandwa/
https://www.threads.com/@repstricklandwa?hl=en
https://twitter.com/RepStricklandWA
https://strickland.house.gov/search/
https://strickland.house.gov/services/help-federal-agency/
htt"
[18] https://wadems.org/about/board - Washington Democrats chair
    > "Chair **Shasti Conrad**"
[19] https://wadems.org/contact - Washington Democrats shared contact
    > "Contact us by phone: (206) 583-0664"
[20] https://governor.wa.gov/contacting-governor - Governor contact and scope
    > "As a state official, Governor Bob Ferguson does not have any jurisdiction over the federal agencies handling issues like social security or immigration."
    > "ccounts/WAGOV/subscriber/new?topic_id=WAGOV_1
https://bsky.app/profile/governorferguson.bsky.social
https://twitter.com/WaStateGov
https://www.facebook.com/WaStateGov
https://www.instagram.com/govferguson/
https://medium.com/wagov"
[21] https://governor.wa.gov/contacting-governor/contacting-governors-office - Governor phone
    > "b Ferguson
Office of the Governor
PO Box 40002
Olympia, WA 98504-0002
Call
360-902-4111
TTY/TDD call 711 or
1-800-833-6384
If you need to speak with someone and y"
[22] https://app.leg.wa.gov/DistrictFinder - Official full-address District Finder
    > "Enter your full address to find your legislative or congressional district."
[23] https://www.sos.wa.gov/elections/data-research/election-data-and-maps/2024-court-designated-legislativecongressional-maps - Official geographic map source
    > "Washington State Legislative & Congressional Districts (front)"
[24] https://leg.wa.gov/media/npcn2rop/us-members-elected-officials_2025_digital.pdf - Washington Legislature 2025 officials reference
    > "Bob Ferguson (D)"
    > "Phone: 202-224-3441
Fax: 202-228-0514"
