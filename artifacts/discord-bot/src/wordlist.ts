// Built-in safety terms. Ordinary profanity is intentionally not included.
const RACIAL_SLURS = [
  "nigger", "nigg3r", "n1gger", "n!gger", "nig nog", "nig-nog", "chink", "ch1nk", "ch!nk",
  "gook", "g00k", "spic", "sp1c", "sp!c", "kike", "k1ke", "k!ke", "wetback", "wet back",
  "beaner", "be4ner", "towelhead", "towel head", "raghead", "rag head", "zipperhead", "coon",
  "c00n", "jigaboo", "jiggaboo", "porch monkey", "sand nigger", "paki", "p4ki", "p@ki",
  "jap", "j@p", "ching chong", "ching-chong", "negro", "mulatto", "half breed", "half-breed",
  "redskin", "red skin", "squaw", "pickaninny", "sambo", "darkie", "jungle bunny",
  "cotton picker", "crotch cricket", "tar baby", "tar-baby", "moon cricket", "spearchucker",
  "spear chucker", "uncle tom", "sellout negro", "rice rocket", "yellow monkey", "camel jockey",
  "camel-jockey", "dothead", "dot head", "turban head", "curry muncher", "hymie", "sheeny",
  "greaseball", "wop", "dago", "kraut", "mongoloid", "gypsy", "gypo", "pikey",
];

const LGBTQ_SLURS = [
  "faggot", "fag", "f4ggot", "f4g", "f@ggot", "f@g", "dyke", "d1ke", "d!ke",
  "tranny", "tr4nny", "tr@nny", "shemale", "she-male", "sodomite", "poof", "p00f",
  "batty boy", "battyboy", "shirt lifter", "pillow biter",
];

const ABLEIST_SLURS = ["retard", "ret4rd", "r3tard", "retarded", "ret4rded", "spaz", "sp4z", "cripple", "mong"];

const CSAM_AND_GROOMING = [
  "child porn", "childporn", "child pornography", "loli", "l0li", "l0l1", "shota", "sh0ta",
  "jailbait", "jail bait", "minor porn", "underage porn", "underage sex", "pedo", "p3do", "ped0",
  "pedophile", "pedophilia", "paedophile", "paedophilia", "hebephile", "hebephilia",
  "ephebophile", "ephebophilia", "cheese pizza", "cub porn", "preteen sex", "preteen nude",
  "preteen porn", "kid porn", "kiddie porn", "kiddy porn", "child rape", "child molestation",
  "child molester", "toddlercon", "babycon", "map community", "nomap", "minor attracted",
  "child groomer", "grooming children", "grooming minors", "send nudes minor", "send nudes kid",
  "rape a child", "rape children", "rape minors", "touch kids", "touching kids", "molesting kids",
  "rape", "r4pe", "r@pe", "rapist", "gang rape", "sexual assault", "non-consensual",
  "nonconsensual", "force myself on", "drugged and raped", "roofie",
  "i'm underage", "im underage", "i am underage", "i'm a minor", "im a minor", "i am a minor",
  "minor here", "underage here", "she is underage", "she's underage", "he is underage",
  "he's underage", "they are underage", "they're underage", "you are underage", "you're underage",
  "ur underage", "she is a minor", "she's a minor", "he is a minor", "he's a minor",
  "they are a minor", "they're a minor", "you are a minor", "you're a minor", "is underage",
  "was underage", "are underage", "were underage", "is a minor", "was a minor", "are minors",
  "were minors", "looking for minors", "minors only", "minors welcome", "minors dm",
  "underage welcome", "underage only", "do you like minors", "are you a minor", "send me a minor",
  "find me a minor", "groom a minor", "grooming a minor", "how to groom", "befriend a minor",
  "target a minor", "don't tell your parents", "dont tell your parents", "don't tell anyone",
  "dont tell anyone", "this is our secret", "keep this secret", "mature for your age",
  "send me pics", "send me photos", "are you alone", "where are your parents", "meet irl",
  "teen nude", "teen nudes", "teen porn", "teen sex", "teenage nude", "teenage porn",
  "teenage sex", "minor nude", "minor nudes", "underage nude", "underage nudes",
  "high school nude", "high school porn", "i like minors", "i love minors", "attracted to minors",
  "attracted to kids", "pro contact", "pro-contact", "minor love", "minor-love",
  "kids can consent", "minors can consent", "underage sexting", "minor sexting", "kid sexting",
  "sexting a minor", "sexting minors", "sexting a kid", "sexting kids", "exploit a minor",
  "exploiting minors", "trafficking minor", "traffic a minor", "child trafficking", "minor trafficking",
  "buy a child", "sell a child",
];

const SELF_HARM_AND_THREATS = [
  "kys", "k y s", "k.y.s", "kill yourself", "kill urself", "go kill yourself", "end yourself",
  "end your life", "rope yourself", "commit suicide", "drink bleach", "cut yourself", "go die",
  "i will kill you", "ill kill you", "i'll kill you", "im going to kill you", "i will shoot you",
  "ill shoot you", "bomb threat", "shoot up the school", "school shooting", "school shooter",
  "mass shooting", "i will find you and kill", "watch your back", "you're dead", "your dead",
  "send me your address", "doxx", "dox", "i will dox", "doxxing", "swat", "swatting",
  "i will swat", "find your ip", "trace your ip", "post your address", "leak your address",
];

const CYBER_AND_RAIDING = [
  "rat link", "grabify", "ip grabber", "ip logger", "ip grab", "ddos", "d-dos", "dox tool",
  "booter", "stresser", "botnet", "keylogger", "trojan horse", "ransomware", "phishing link",
  "token grabber", "token grab", "account stealer", "cookie stealer", "malware",
  "remote access trojan", "raid this server", "raid them", "lets raid", "let's raid",
  "nuke this server", "server nuke", "mass report", "report bot", "spam bot",
  "free nitro", "nitro gift link", "claim your nitro", "nitro giveaway link",
  "discord nitro free", "get free nitro", "win nitro", "steam gift card", "free steam gift",
  "claim your prize", "you have been selected", "click this link to claim",
  "verify your account to claim", "your account has been flagged", "your account will be deleted",
  "discord support dm", "official discord dm", "account verification required", "verify or get banned",
  "free robux", "robux generator", "crypto giveaway", "bitcoin giveaway", "eth giveaway",
  "airdrop claim", "wallet connect scam",
];

const EXTREMISM_AND_GORE = [
  "join isis", "join al qaeda", "join al-qaeda", "isis recruit", "jihad", "white power",
  "white supremacy", "white supremacist", "heil hitler", "sieg heil", "ku klux klan",
  "14 words", "blood and soil", "white pride", "race war", "white genocide", "great replacement",
  "incel revolution", "elliot rodger", "christchurch", "dylann roof", "brenton tarrant",
  "gore video", "gore site", "gore pic", "gore image", "gore photo", "send gore", "post gore",
  "drop gore", "share gore", "snuff film", "snuff video", "liveleak", "bestgore", "necrophilia",
  "body parts for sale", "decapitation video", "beheading video", "cut sign", "blood wall",
  "cutting pic", "self harm pic", "self harm photo", "show me your cuts", "rate my cuts",
  "extort", "extortion", "blackmail", "pay me or i leak", "pay or i post", "sextortion",
  "leak your nudes", "money laundering", "fraud scheme", "scam people", "pyramid scheme",
  "ponzi scheme", "buy heroin", "sell heroin", "buy meth", "sell meth", "buy fentanyl",
  "sell fentanyl", "drug dealer", "darkweb drugs", "buy cocaine", "buy crack",
];

const SEXUAL_AND_TOS = [
  "porn", "porno", "pornography", "p0rn", "pr0n", "xxx", "x-rated", "onlyfans", "only fans",
  "pornhub", "xvideos", "xhamster", "redtube", "youporn", "xnxx", "spankbang", "eporner",
  "send nudes", "send nude", "send pics", "send me nudes", "nudes for", "nudes trade",
  "nude trade", "post nudes", "drop nudes", "share nudes", "dick pic", "dick pics",
  "cock pic", "pussy pic", "tit pic", "boob pic", "ass pic", "nude selfie", "topless pic",
  "naked pic", "sex tape", "sextape", "sex video", "homemade porn", "amateur porn",
  "cam girl", "camgirl", "cam boy", "camshow", "findom", "pay pig", "sugar daddy link",
  "sugar baby link", "fuck buddy", "hookup site", "dating site link", "blowjob", "blow job",
  "hand job", "handjob", "cumshot", "gangbang", "threesome link", "orgy", "group sex",
  "hentai", "h3ntai", "rule 34", "e621", "furry nsfw", "anime porn", "anime hentai",
  "leak", "leaked", "nudes", "leaked nudes", "leaked nude", "nude leak", "nude leaks",
  "leaked pics", "leaked photos", "leaked images", "leaked content", "leaked pack", "leak pack",
  "leak link", "nude pack", "nudes pack", "nude bundle", "nude dump", "onlyfans leak",
  "patreon leak", "fansly leak", "mega link nudes", "google drive nudes", "nude snap",
  "nude snapchat", "snap leak", "nude dm", "drop leaks", "post leaks", "share leaks",
  "anyone got leaks", "got any leaks", "anyone got nudes", "got any nudes", "nsfw link",
  "nsfw links", "nsfw pack", "nsfw dump", "nsfw content link",
  "thinspo", "thinspiration", "pro-ana", "proana", "pro ana", "pro-mia", "promia", "pro mia",
  "meanspo", "starving tips", "tips to starve", "how to starve", "extreme fasting",
  "eating disorder tips", "binge purge tips", "purging tips", "diet pills", "laxative abuse",
  "body check", "body checking", "zoophilia", "zoophile", "bestiality", "animal porn",
  "animal sex", "dog porn", "horse porn", "animal rape", "furry porn real",
  "selling discord account", "buy discord account", "discord account for sale", "selling account",
  "account shop", "selling aged account", "og account for sale", "selling og username",
  "fake boost", "selling server members", "buying server members", "member farming", "fake members",
];

const NAZI_TERMS = [
  "hitler", "adolf hitler", "nazi", "nazis", "third reich", "3rd reich", "fuhrer", "führer",
  "heinrich himmler", "himmler", "joseph goebbels", "goebbels", "hermann goering", "goering",
  "reinhard heydrich", "rudolf hess", "martin bormann", "eichmann", "mengele", "mein kampf",
  "national socialism", "national socialist", "nationalsozialismus", "aryan race", "master race",
  "lebensraum", "final solution", "holocaust denial", "gas the jews", "swastika", "hakenkreuz",
  "waffen ss", "totenkopf", "gestapo", "nsdap", "brownshirts", "schutzstaffel", "hitler youth",
  "neo nazi", "neo-nazi", "neonazi", "heil 88", "88 heil", "1312", "rwds", "boogaloo",
  "accelerationist", "atomwaffen", "proud boys", "oath keepers", "three percenters",
];

export const BLOCKED_TERMS: string[] = [
  ...RACIAL_SLURS, ...LGBTQ_SLURS, ...ABLEIST_SLURS, ...CSAM_AND_GROOMING,
  ...SELF_HARM_AND_THREATS, ...CYBER_AND_RAIDING, ...EXTREMISM_AND_GORE,
  ...SEXUAL_AND_TOS, ...NAZI_TERMS,
];

const SEP = String.raw`[\s.*_\-@0!1|,/\\;:'"~^` + "`" + `]+`;
const SEP0 = String.raw`[\s.*_\-@0!1|,/\\;:'"~^` + "`" + `]*`;

export const BLOCKED_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: new RegExp(String.raw`\bn` + SEP + String.raw`i` + SEP0 + String.raw`g` + SEP0 + String.raw`g` + SEP0 + String.raw`[e3@]`, "i"), label: "racial slur (separator bypass)" },
  { regex: new RegExp(String.raw`\bf` + SEP + String.raw`a` + SEP0 + String.raw`g` + SEP0 + String.raw`g` + SEP0 + String.raw`[o0]` + SEP0 + String.raw`t`, "i"), label: "homophobic slur (separator bypass)" },
  { regex: new RegExp(String.raw`h` + SEP + String.raw`e` + SEP0 + String.raw`i` + SEP0 + String.raw`l` + SEP + String.raw`h` + SEP0 + String.raw`i` + SEP0 + String.raw`t` + SEP0 + String.raw`l` + SEP0 + String.raw`e` + SEP0 + String.raw`r`, "i"), label: "extremist phrase (separator bypass)" },
  { regex: new RegExp(String.raw`s` + SEP + String.raw`i` + SEP0 + String.raw`e` + SEP0 + String.raw`g` + SEP + String.raw`h` + SEP0 + String.raw`e` + SEP0 + String.raw`i` + SEP0 + String.raw`l`, "i"), label: "extremist phrase (separator bypass)" },
  { regex: new RegExp(String.raw`\bk` + SEP + String.raw`y` + SEP0 + String.raw`s\b`, "i"), label: "self-harm encouragement (separator bypass)" },
  { regex: new RegExp(String.raw`c` + SEP0 + String.raw`h` + SEP0 + String.raw`i` + SEP0 + String.raw`l` + SEP0 + String.raw`d` + SEP + String.raw`p` + SEP0 + String.raw`o` + SEP0 + String.raw`r` + SEP0 + String.raw`n`, "i"), label: "CSAM (separator bypass)" },
  { regex: new RegExp(String.raw`\bl` + SEP + String.raw`[o0]` + SEP0 + String.raw`l` + SEP0 + String.raw`[i!1]`, "i"), label: "CSAM term (separator bypass)" },
  { regex: new RegExp(String.raw`\bc` + SEP0 + String.raw`h` + SEP0 + String.raw`[i!1]` + SEP0 + String.raw`n` + SEP0 + String.raw`k\b`, "i"), label: "racial slur (separator bypass)" },
  { regex: new RegExp(String.raw`\br` + SEP0 + String.raw`[e3]` + SEP0 + String.raw`t` + SEP0 + String.raw`[a4]` + SEP0 + String.raw`r` + SEP0 + String.raw`d\b`, "i"), label: "ableist slur (separator bypass)" },
  { regex: new RegExp(String.raw`\bk` + SEP0 + String.raw`[i!1]` + SEP0 + String.raw`k` + SEP0 + String.raw`[e3]\b`, "i"), label: "racial slur (separator bypass)" },
  { regex: new RegExp(String.raw`\bs` + SEP0 + String.raw`p` + SEP0 + String.raw`[i!1]` + SEP0 + String.raw`c\b`, "i"), label: "racial slur (separator bypass)" },
  { regex: new RegExp(String.raw`token` + SEP + String.raw`(grab|steal)`, "i"), label: "token grabber" },
  { regex: new RegExp(String.raw`ip` + SEP + String.raw`(grab|log)`, "i"), label: "IP logger/grabber" },
  { regex: new RegExp(String.raw`\bd` + SEP0 + String.raw`d` + SEP0 + String.raw`o` + SEP0 + String.raw`s\b`, "i"), label: "DDoS (separator bypass)" },
  { regex: new RegExp(String.raw`sw` + SEP0 + String.raw`a` + SEP0 + String.raw`t` + SEP0 + String.raw`t` + SEP0 + String.raw`[io]`, "i"), label: "swatting" },
  { regex: new RegExp(String.raw`\br` + SEP0 + String.raw`[a@4]` + SEP0 + String.raw`p` + SEP0 + String.raw`[e3]\b`, "i"), label: "sexual violence (separator bypass)" },
  { regex: new RegExp(String.raw`\bp` + SEP0 + String.raw`[e3]` + SEP0 + String.raw`d` + SEP0 + String.raw`[o0]\b`, "i"), label: "CSAM term (separator bypass)" },
  { regex: new RegExp(String.raw`\bblack` + SEP0 + String.raw`m` + SEP0 + String.raw`a` + SEP0 + String.raw`i` + SEP0 + String.raw`l\b`, "i"), label: "blackmail" },
  { regex: new RegExp(String.raw`free` + SEP + String.raw`nitro`, "i"), label: "free nitro phishing" },
  { regex: new RegExp(String.raw`only` + SEP + String.raw`fans`, "i"), label: "OnlyFans link" },
  { regex: /\bi'?m\s+(1[0-7]|[5-9])(\s+years?\s+old)?\b/i, label: "claim of being underage" },
  { regex: /\bi\s+am\s+(1[0-7]|[5-9])(\s+years?\s+old)?\b/i, label: "claim of being underage" },
  { regex: /\bteen(age)?\s+(nude|nudes|naked|porn|sex|pic|pics|photo|photos)\b/i, label: "minor sexualization" },
  { regex: /\bunderage\s+(nude|nudes|naked|porn|sex|pic|pics|photo|photos|girl|boy)\b/i, label: "minor sexualization" },
  { regex: /don'?t\s+tell\s+(your\s+)?(parents?|mom|dad|anyone|nobody)\b/i, label: "grooming phrase" },
];
