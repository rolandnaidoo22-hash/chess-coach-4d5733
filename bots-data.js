/* v52: original bots for "Play the bots". Pure data: rating, style knobs, openings, chat lines, and a simple dark-and-gold SVG avatar.
   elo: shown rating. movetime: Stockfish thinking cap (ms). mpv: how many candidate moves to look at.
   temp: how loosely it picks among good moves (centipawns). randomness: chance of a random legal move.
   blunderRate: chance of deliberately leaving a piece hanging. aggression: bonus for captures and checks (centipawns). */
(function(){
const G="#d4af37", D="#1b1712", L="#f3e3b0";
const ring=(inner)=>`<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="${D}" stroke="${G}" stroke-width="2"/>${inner}</svg>`;
const face=(y)=>`<circle cx="27" cy="${y}" r="1.8" fill="${D}"/><circle cx="37" cy="${y}" r="1.8" fill="${D}"/>`;
window.CRBotsData=[
{id:"pip",name:"Pip",elo:250,style:"Wobbly beginner",tag:"Learning the moves",
 story:"Pip found a chess set in the attic last week and is very excited about it.",
 movetime:150,mpv:6,temp:400,randomness:0.35,blunderRate:0.25,aggression:40,
 openings:[["e4","a3"],["e5","h6"]],
 chat:{start:["Hi! Which way does the horse go again?","I'm still learning. Be nice!"],capture:["Ooh, I got one!","Yum, a piece!"],check:["Check! Did I say that right?"],lost:["You won! Can we play again?"],won:["I won?! Wow!"],draw:["A draw! That's fair."]},
 avatar:ring(`<circle cx="32" cy="24" r="9" fill="${G}"/><path d="M22 50c0-9 4-14 10-14s10 5 10 14z" fill="${G}"/><rect x="20" y="48" width="24" height="5" rx="2" fill="${G}"/>${face(24)}<path d="M28 28q4 3 8 0" stroke="${D}" stroke-width="1.6" fill="none"/>`)},
{id:"maisie",name:"Butterfingers Maisie",elo:550,style:"Sometimes blunders a piece",tag:"Drops pieces",
 story:"Maisie runs the village bakery and plays between batches. Her mind is often on the oven.",
 movetime:250,mpv:5,temp:150,randomness:0.08,blunderRate:0.22,aggression:30,
 openings:[["e4","Nf3","Bc4"],["e5","Nc6"]],
 chat:{start:["Let me just wipe the flour off my hands.","Ready when you are, dear!"],capture:["Oh, I'll take that, thank you."],check:["Check! Mind your king."],blunder:["Oops, butterfingers!","Oh dear, I left that one alone."],lost:["Well played! Have a bun."],won:["Fresh out of the oven: a win!"],draw:["Half each, like a split loaf."]},
 avatar:ring(`<circle cx="32" cy="27" r="10" fill="${G}"/><path d="M20 20q12-12 24 0z" fill="${L}"/><rect x="21" y="18" width="22" height="4" rx="2" fill="${L}"/>${face(27)}<path d="M28 31q4 3 8 0" stroke="${D}" stroke-width="1.6" fill="none"/><path d="M18 54c0-10 6-15 14-15s14 5 14 15z" fill="${G}"/>`)},
{id:"grab",name:"Captain Grab",elo:800,style:"Aggressive, loves captures",tag:"Takes everything",
 story:"A retired harbour captain who believes every piece on the board is treasure to be grabbed.",
 movetime:350,mpv:5,temp:90,randomness:0.04,blunderRate:0.06,aggression:180,
 openings:[["e4","d4"],["e5","d5"]],
 chat:{start:["Hoist the sails! Your pieces are mine.","I take first and ask later."],capture:["Mine now!","Into the treasure chest it goes!","Another one for the hold!"],check:["Check! Abandon ship!"],lost:["You sank my ship. Well sailed."],won:["The treasure is mine!"],draw:["Calm seas. A draw."]},
 avatar:ring(`<circle cx="32" cy="30" r="10" fill="${G}"/><path d="M17 23h30l-5-9H22z" fill="${G}"/><rect x="17" y="22" width="30" height="3" fill="${L}"/><circle cx="27" cy="30" r="1.8" fill="${D}"/><rect x="33" y="27" width="7" height="5" rx="1" fill="${D}"/><path d="M27 35h10" stroke="${D}" stroke-width="1.6"/><path d="M18 56c0-9 6-14 14-14s14 5 14 14z" fill="${G}"/>`)},
{id:"ivy",name:"Sister Ivy",elo:1000,style:"Solid and careful",tag:"Never rushes",
 story:"Ivy tends the garden and plays the same safe set-up every game. Patient as a growing tree.",
 movetime:450,mpv:4,temp:60,randomness:0.02,blunderRate:0.03,aggression:-20,
 openings:[["d4","Bf4","e3","Nf3"],["d5","Nf6","e6"]],
 chat:{start:["Slow and steady grows the garden.","Let's take our time."],capture:["A fair trade."],check:["Check. Gently does it."],lost:["Lovely game. You earned it."],won:["Patience pays off."],draw:["A peaceful draw."]},
 avatar:ring(`<circle cx="32" cy="28" r="10" fill="${G}"/><path d="M19 30q0-18 13-18t13 18q-3-10-13-10t-13 10z" fill="${L}"/>${face(28)}<path d="M29 32q3 2 6 0" stroke="${D}" stroke-width="1.6" fill="none"/><path d="M19 56c0-9 6-14 13-14s13 5 13 14z" fill="${G}"/><path d="M44 46q6-4 6-10q-5 2-6 10z" fill="${L}"/>`)},
{id:"tock",name:"Professor Tock",elo:1300,style:"Balanced, likes plans",tag:"Thinks ahead",
 story:"A clockmaker who sees every game as a set of gears. Each piece must turn at the right time.",
 movetime:650,mpv:4,temp:35,randomness:0.01,blunderRate:0.015,aggression:20,
 openings:[["Nf3","c4","g3"],["c5","Nc6"]],
 chat:{start:["Tick, tock. Let's begin.","Every move is a gear."],capture:["The gears turn in my favour."],check:["Check. Right on time."],lost:["Your clockwork beat mine."],won:["Precise as a pocket watch."],draw:["Both clocks stopped. A draw."]},
 avatar:ring(`<circle cx="32" cy="28" r="10" fill="${G}"/><circle cx="27" cy="28" r="3.5" fill="none" stroke="${D}" stroke-width="1.5"/><circle cx="37" cy="28" r="3.5" fill="none" stroke="${D}" stroke-width="1.5"/><path d="M30.5 28h3" stroke="${D}" stroke-width="1.5"/><path d="M24 36q8 5 16 0" stroke="${L}" stroke-width="3" fill="none"/><path d="M19 56c0-9 6-14 13-14s13 5 13 14z" fill="${G}"/><circle cx="32" cy="49" r="3" fill="none" stroke="${D}" stroke-width="1.4"/>`)},
{id:"blaze",name:"Blaze",elo:1600,style:"Attacker, plays for the king",tag:"All-out attack",
 story:"A street drummer who plays chess fast and loud. Blaze aims every piece at your king.",
 movetime:800,mpv:4,temp:25,randomness:0.01,blunderRate:0.005,aggression:90,
 openings:[["e4","f4"],["e5","d5"]],
 chat:{start:["Let's make some noise!","Your king had better be ready."],capture:["Boom!","Out of my way!"],check:["Check! Feel the beat."],lost:["You stopped the drums. Respect."],won:["Encore!"],draw:["The music stops. A draw."]},
 avatar:ring(`<path d="M32 9q9 9 5 15q6-3 5-9q8 10 2 21H20q-6-11 3-20q0 6 5 8q-3-8 4-15z" fill="${L}"/><circle cx="32" cy="32" r="10" fill="${G}"/>${face(32)}<path d="M28 36h8" stroke="${D}" stroke-width="1.6"/><path d="M19 58c0-8 6-12 13-12s13 4 13 12z" fill="${G}"/>`)},
{id:"aurelia",name:"Queen Aurelia",elo:2000,style:"Sharp and precise",tag:"The strongest",
 story:"Ruler of the golden board. She has never lost a game in her own castle. Can you be the first?",
 movetime:1200,mpv:3,temp:12,randomness:0,blunderRate:0,aggression:10,
 openings:[["e4","d4","c4"],["c5","e6","Nf6"]],
 chat:{start:["Welcome to my castle.","Show me what you have learned."],capture:["As expected."],check:["Check. Kneel."],lost:["Impressive. You may keep the crown, for now."],won:["The crown stays with me."],draw:["A draw against a queen is no small thing."]},
 avatar:ring(`<path d="M20 22l4-10 4 7 4-9 4 9 4-7 4 10z" fill="${G}"/><circle cx="32" cy="31" r="9" fill="${G}"/>${face(31)}<path d="M29 35q3 2 6 0" stroke="${D}" stroke-width="1.6" fill="none"/><path d="M18 58c0-10 6-16 14-16s14 6 14 16z" fill="${G}"/><circle cx="32" cy="48" r="2.5" fill="${L}"/>`)}
];
})();
