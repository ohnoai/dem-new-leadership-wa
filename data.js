/* Source audit and limitations: docs/sources.md. Reverify before launch or a new Congress. */
window.CAMPAIGN = {
 state:'Washington', code:'WA', updated:'2026-11-09',
 kicker:'WASHINGTON / INDEPENDENT & UNCOMPROMISING',
 repository:'https://github.com/ohnoai/dem-new-leadership-wa',
 districtFinder:'https://app.leg.wa.gov/DistrictFinder/',
 districtMaps:'https://www.sos.wa.gov/elections/data-research/election-data-and-maps/2024-court-designated-legislativecongressional-maps',
 officials:[
 {id:'murray',name:'Patty Murray',office:'U.S. Senator',group:'senate',district:'Statewide',party:'Democratic',vote:'senate',phone:'202-224-2621',website:'https://www.murray.senate.gov/write-to-patty/',social:'https://x.com/PattyMurray',priority:1},
 {id:'cantwell',name:'Maria Cantwell',office:'U.S. Senator',group:'senate',district:'Statewide',party:'Democratic',vote:'senate',phone:'202-224-3441',website:'https://www.cantwell.senate.gov/contact/email',social:'https://x.com/SenatorCantwell',priority:1},
 {id:'delbene',name:'Suzan DelBene',office:'U.S. Representative',group:'house',district:'WA-01',party:'Democratic',vote:'house',phone:'202-225-6311',website:'https://delbene.house.gov/contact/',social:'https://twitter.com/RepDelBene',priority:1},
 {id:'larsen',name:'Rick Larsen',office:'U.S. Representative',group:'house',district:'WA-02',party:'Democratic',vote:'house',phone:'202-225-2605',website:'https://larsen.house.gov/contact/',social:'https://www.facebook.com/RepRickLarsen',priority:1},
 {id:'perez',name:'Marie Gluesenkamp Perez',greeting:'Dear Representative Gluesenkamp Perez,',office:'U.S. Representative',group:'house',district:'WA-03',party:'Democratic',vote:'house',phone:'202-225-3536',website:'https://gluesenkampperez.house.gov/contact',social:'https://twitter.com/RepMGP',priority:1},
 {id:'newhouse',name:'Dan Newhouse',office:'U.S. Representative',group:'house',district:'WA-04',party:'Republican',vote:null,phone:'202-225-5816',website:'https://newhouse.house.gov/contact',social:'',priority:2},
 {id:'baumgartner',name:'Michael Baumgartner',office:'U.S. Representative',group:'house',district:'WA-05',party:'Republican',vote:null,phone:'202-225-2006',website:'https://baumgartner.house.gov/contact/',social:'https://x.com/RepBaumgartner',priority:2},
 {id:'randall',name:'Emily Randall',office:'U.S. Representative',group:'house',district:'WA-06',party:'Democratic',vote:'house',phone:'202-225-5916',website:'https://randall.house.gov/contact',social:'https://facebook.com/RepEmilyRandall',priority:1},
 {id:'jayapal',name:'Pramila Jayapal',office:'U.S. Representative',group:'house',district:'WA-07',party:'Democratic',vote:'house',phone:'202-225-3106',website:'https://jayapal.house.gov/contact/',social:'http://www.twitter.com/RepJayapal/',priority:1},
 {id:'schrier',name:'Kim Schrier',office:'U.S. Representative',group:'house',district:'WA-08',party:'Democratic',vote:'house',phone:'202-225-7761',website:'https://schrier.house.gov/contact',social:'https://x.com/repkimschrier',priority:1},
 {id:'smith',name:'Adam Smith',office:'U.S. Representative',group:'house',district:'WA-09',party:'Democratic',vote:'house',phone:'202-225-8901',website:'https://adamsmith.house.gov/contact',social:'https://twitter.com/RepAdamSmith',priority:1},
 {id:'strickland',name:'Marilyn Strickland',office:'U.S. Representative',group:'house',district:'WA-10',party:'Democratic',vote:'house',phone:'202-225-9740',website:'https://strickland.house.gov/contact/',social:'https://twitter.com/RepStricklandWA',priority:1},
 {id:'conrad',name:'Shasti Conrad',greeting:'Dear Chair Conrad,',office:'Washington Democrats Chair',group:'influence',district:'State party',party:'Democratic',vote:null,phone:'206-583-0664',website:'https://wadems.org/contact/',social:'',priority:2},
 {id:'ferguson',name:'Bob Ferguson',greeting:'Dear Governor Ferguson,',office:'Governor of Washington',group:'influence',district:'Statewide',party:'Democratic',vote:null,phone:'360-902-4111',website:'https://governor.wa.gov/contacting-governor',social:'https://twitter.com/WaStateGov',priority:2}
 ],
 // Dated form evidence and unknowns: docs/contact-forms.md. Limits are client-side only.
 forms:{
   murray:{note:'Address, email, topic and subject required. Message and subject limits unverified.'},
   cantwell:{note:'Address, phone, email confirmation, topic and subject required. Limits unverified.'},
   delbene:{note:'ZIP district check before the message form. Downstream fields and limits unverified.'},
   larsen:{note:'ZIP and ZIP+4 district check before the message form. Downstream limits unverified.'},
   perez:{note:'Full-address district check before the message. Limits unverified; Pacific County address problems: call the office.'},
   newhouse:{note:'USPS-recognized address check before the message. Downstream fields and limits unverified.'},
   baumgartner:{message:{status:'verified',limit:2000,newlines:'crlf',date:'2026-11-10',source:'https://baumgartner.house.gov/contact/email-me/'},note:'Verified message cap: 2,000, counting line breaks as two. Choose an issue; no separate subject box was displayed.'},
   randall:{note:'USPS-recognized address check before the message. Downstream fields and limits unverified.'},
   jayapal:{message:{status:'verified',limit:2000,date:'2026-11-10',source:'https://jayapal.house.gov/contact/'},subject:{status:'verified',limit:400,date:'2026-11-10',source:'https://jayapal.house.gov/contact/'},note:'Verified message cap: 2,000; subject: 400. Address, phone and topic required. Email link also has a ZIP check.'},
   schrier:{note:'USPS-recognized address check before the message. Downstream fields and limits unverified.'},
   smith:{note:'Four-page form; identity required on page one, with a CAPTCHA notice. Later fields and limits unverified.'},
   strickland:{note:'Address, email, phone, phone type and response preference required. No subject box displayed; message limit unverified.'},
   conrad:{note:'Party contact page was inaccessible behind a security check. Fields and limits unverified; phone is an alternative.'},
   ferguson:{note:'Subject is a category dropdown, not a text box. Address, email and phone required; message limit unverified. Correspondence may be publicly disclosed.'}
 },
 sources:[
 {name:'Source audit and limitations',url:'docs/sources.md'},
 {name:'U.S. Senate - current senator directory',url:'https://www.senate.gov/senators/index.htm'},
 {name:'U.S. House - district, party and phone directory',url:'https://www.house.gov/representatives'},
 {name:'WA Legislature - congressional and statewide officials (2025 reference)',url:'https://leg.wa.gov/media/npcn2rop/us-members-elected-officials_2025_digital.pdf'},
 {name:'WA Democrats - Executive Committee',url:'https://wadems.org/about/board/'},
 {name:'WA Democrats - shared party contact',url:'https://wadems.org/contact/'},
 {name:'Governor - office contact and telephone',url:'https://governor.wa.gov/contacting-governor/contacting-governors-office'},
 {name:'Find your congressional district by full address',url:'https://app.leg.wa.gov/DistrictFinder/'},
 {name:'WA Secretary of State - official geographic district maps',url:'https://www.sos.wa.gov/elections/data-research/election-data-and-maps/2024-court-designated-legislativecongressional-maps'}
 ]
};
for (const official of window.CAMPAIGN.officials) official.form = window.CAMPAIGN.forms[official.id];
