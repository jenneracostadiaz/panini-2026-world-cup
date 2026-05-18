import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  collection,
  stickers,
  teams,
  users,
  type NewCollectionEntry,
  type NewSticker,
  type NewTeam,
} from "./schema.js";

type TeamSeed = {
  id: string;
  name: string;
  code: string;
  color: string;
  conf: string;
  confName: string;
};

type SpecialSticker = {
  id: string;
  label: string;
  icon: string;
  foil: boolean;
};

type SpecialSection = {
  id: "intro" | "museum";
  stickers: SpecialSticker[];
};

const FLAG_CODES: Record<string, string> = {
  usa: "us",
  canada: "ca",
  mexico: "mx",
  argentina: "ar",
  brazil: "br",
  uruguay: "uy",
  colombia: "co",
  ecuador: "ec",
  paraguay: "py",
  england: "gb-eng",
  france: "fr",
  spain: "es",
  germany: "de",
  portugal: "pt",
  netherlands: "nl",
  belgium: "be",
  croatia: "hr",
  switzerland: "ch",
  austria: "at",
  turkey: "tr",
  czechia: "cz",
  scotland: "gb-sct",
  norway: "no",
  sweden: "se",
  bosnia: "ba",
  serbia: "rs",
  morocco: "ma",
  senegal: "sn",
  algeria: "dz",
  capeverde: "cv",
  egypt: "eg",
  ghana: "gh",
  ivorycoast: "ci",
  southafrica: "za",
  tunisia: "tn",
  drcongo: "cd",
  japan: "jp",
  southkorea: "kr",
  australia: "au",
  iran: "ir",
  saudiarabia: "sa",
  qatar: "qa",
  jordan: "jo",
  uzbekistan: "uz",
  iraq: "iq",
  panama: "pa",
  curacao: "cw",
  haiti: "ht",
  newzealand: "nz",
};

const TEAMS: TeamSeed[] = [
  { id: "usa", name: "United States", code: "USA", color: "#B22234", conf: "hosts", confName: "Host Nation" },
  { id: "canada", name: "Canada", code: "CAN", color: "#FF0000", conf: "hosts", confName: "Host Nation" },
  { id: "mexico", name: "Mexico", code: "MEX", color: "#006847", conf: "hosts", confName: "Host Nation" },
  { id: "argentina", name: "Argentina", code: "ARG", color: "#74ACDF", conf: "conmebol", confName: "CONMEBOL" },
  { id: "brazil", name: "Brazil", code: "BRA", color: "#009C3B", conf: "conmebol", confName: "CONMEBOL" },
  { id: "uruguay", name: "Uruguay", code: "URU", color: "#5EB6E4", conf: "conmebol", confName: "CONMEBOL" },
  { id: "colombia", name: "Colombia", code: "COL", color: "#FCD116", conf: "conmebol", confName: "CONMEBOL" },
  { id: "ecuador", name: "Ecuador", code: "ECU", color: "#FFD100", conf: "conmebol", confName: "CONMEBOL" },
  { id: "paraguay", name: "Paraguay", code: "PAR", color: "#D52B1E", conf: "conmebol", confName: "CONMEBOL" },
  { id: "england", name: "England", code: "ENG", color: "#CF081F", conf: "uefa", confName: "UEFA" },
  { id: "france", name: "France", code: "FRA", color: "#002395", conf: "uefa", confName: "UEFA" },
  { id: "spain", name: "Spain", code: "ESP", color: "#AA151B", conf: "uefa", confName: "UEFA" },
  { id: "germany", name: "Germany", code: "GER", color: "#333333", conf: "uefa", confName: "UEFA" },
  { id: "portugal", name: "Portugal", code: "POR", color: "#006600", conf: "uefa", confName: "UEFA" },
  { id: "netherlands", name: "Netherlands", code: "NED", color: "#FF4F00", conf: "uefa", confName: "UEFA" },
  { id: "belgium", name: "Belgium", code: "BEL", color: "#EF3340", conf: "uefa", confName: "UEFA" },
  { id: "croatia", name: "Croatia", code: "CRO", color: "#FF0000", conf: "uefa", confName: "UEFA" },
  { id: "switzerland", name: "Switzerland", code: "SUI", color: "#FF0000", conf: "uefa", confName: "UEFA" },
  { id: "austria", name: "Austria", code: "AUT", color: "#ED2939", conf: "uefa", confName: "UEFA" },
  { id: "turkey", name: "Türkiye", code: "TUR", color: "#E30A17", conf: "uefa", confName: "UEFA" },
  { id: "czechia", name: "Czechia", code: "CZE", color: "#D7141A", conf: "uefa", confName: "UEFA" },
  { id: "scotland", name: "Scotland", code: "SCO", color: "#003087", conf: "uefa", confName: "UEFA" },
  { id: "norway", name: "Norway", code: "NOR", color: "#EF2B2D", conf: "uefa", confName: "UEFA" },
  { id: "sweden", name: "Sweden", code: "SWE", color: "#006AA7", conf: "uefa", confName: "UEFA" },
  { id: "bosnia", name: "Bosnia & Herz.", code: "BIH", color: "#002395", conf: "uefa", confName: "UEFA" },
  { id: "morocco", name: "Morocco", code: "MAR", color: "#C1272D", conf: "caf", confName: "CAF" },
  { id: "senegal", name: "Senegal", code: "SEN", color: "#00853F", conf: "caf", confName: "CAF" },
  { id: "algeria", name: "Algeria", code: "ALG", color: "#006233", conf: "caf", confName: "CAF" },
  { id: "capeverde", name: "Cape Verde", code: "CPV", color: "#003893", conf: "caf", confName: "CAF" },
  { id: "egypt", name: "Egypt", code: "EGY", color: "#CE1126", conf: "caf", confName: "CAF" },
  { id: "ghana", name: "Ghana", code: "GHA", color: "#006B3F", conf: "caf", confName: "CAF" },
  { id: "ivorycoast", name: "Ivory Coast", code: "CIV", color: "#F77F00", conf: "caf", confName: "CAF" },
  { id: "southafrica", name: "South Africa", code: "RSA", color: "#007A4D", conf: "caf", confName: "CAF" },
  { id: "tunisia", name: "Tunisia", code: "TUN", color: "#E70013", conf: "caf", confName: "CAF" },
  { id: "drcongo", name: "DR Congo", code: "COD", color: "#007FFF", conf: "caf", confName: "CAF" },
  { id: "japan", name: "Japan", code: "JPN", color: "#BC002D", conf: "afc", confName: "AFC" },
  { id: "southkorea", name: "South Korea", code: "KOR", color: "#003478", conf: "afc", confName: "AFC" },
  { id: "australia", name: "Australia", code: "AUS", color: "#00008B", conf: "afc", confName: "AFC" },
  { id: "iran", name: "Iran", code: "IRN", color: "#239F40", conf: "afc", confName: "AFC" },
  { id: "saudiarabia", name: "Saudi Arabia", code: "KSA", color: "#006C35", conf: "afc", confName: "AFC" },
  { id: "qatar", name: "Qatar", code: "QAT", color: "#8D1B3D", conf: "afc", confName: "AFC" },
  { id: "jordan", name: "Jordan", code: "JOR", color: "#007A3D", conf: "afc", confName: "AFC" },
  { id: "uzbekistan", name: "Uzbekistan", code: "UZB", color: "#1EB53A", conf: "afc", confName: "AFC" },
  { id: "iraq", name: "Iraq", code: "IRQ", color: "#CE1126", conf: "afc", confName: "AFC" },
  { id: "panama", name: "Panama", code: "PAN", color: "#005293", conf: "concacaf", confName: "CONCACAF" },
  { id: "curacao", name: "Curaçao", code: "CUR", color: "#003DA5", conf: "concacaf", confName: "CONCACAF" },
  { id: "haiti", name: "Haiti", code: "HAI", color: "#00209F", conf: "concacaf", confName: "CONCACAF" },
  { id: "newzealand", name: "New Zealand", code: "NZL", color: "#00247D", conf: "ofc", confName: "OFC" },
];

const SPECIAL_SECTIONS: SpecialSection[] = [
  {
    id: "intro",
    stickers: [
      { id: "INT-1", label: "Album Cover", icon: "📖", foil: false },
      { id: "INT-2", label: "Official Emblem", icon: "🏆", foil: true },
      { id: "INT-3", label: "Mascot", icon: "🎭", foil: false },
      { id: "INT-4", label: "Trophy", icon: "🥇", foil: true },
      { id: "INT-5", label: "Host – Canada", icon: "🇨🇦", foil: false },
      { id: "INT-6", label: "Host – Mexico", icon: "🇲🇽", foil: false },
      { id: "INT-7", label: "Host – USA", icon: "🇺🇸", foil: false },
      { id: "INT-8", label: "Format", icon: "📋", foil: false },
      { id: "INT-9", label: "Welcome", icon: "⭐", foil: true },
    ],
  },
  {
    id: "museum",
    stickers: [
      { id: "MUS-1", label: "Uruguay 1930", icon: "🇺🇾", foil: false },
      { id: "MUS-2", label: "Italy 1934", icon: "🇮🇹", foil: false },
      { id: "MUS-3", label: "Italy 1938", icon: "🇮🇹", foil: false },
      { id: "MUS-4", label: "Uruguay 1950", icon: "🇺🇾", foil: false },
      { id: "MUS-5", label: "W. Germany 1954", icon: "🇩🇪", foil: false },
      { id: "MUS-6", label: "Brazil 1958", icon: "🇧🇷", foil: false },
      { id: "MUS-7", label: "Brazil 1962", icon: "🇧🇷", foil: false },
      { id: "MUS-8", label: "England 1966", icon: "🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", foil: false },
      { id: "MUS-9", label: "Brazil 1970", icon: "🇧🇷", foil: false },
      { id: "MUS-10", label: "W. Germany 1974", icon: "🇩🇪", foil: false },
      { id: "MUS-11", label: "Argentina 1978", icon: "🇦🇷", foil: false },
    ],
  },
];

const PLAYERS: Record<string, string[]> = {
  usa: ["Matt Freese", "Chris Richards", "Tim Ream", "Mark McKenzie", "Alex Freeman", "Antonee Robinson", "Tyler Adams", "Tanner Tessmann", "Weston McKennie", "Christian Roldan", "Timothy Weah", "Diego Luna", "Malik Tillman", "Christian Pulisic", "Brenden Aaronson", "Ricardo Pepi", "Haji Wright", "Folarin Balogun"],
  canada: ["Dayne St.Clair", "Alphonso Davies", "Alistair Johnston", "Samuel Adekugbe", "Riche Laryea", "Derek Cornelius", "Moïse Bombito", "Kamal Miller", "Stephen Eustáquio", "Ismaël Koné", "Jonathan Osorio", "Jacob Shaffelburg", "Mathieu Choinière", "Niko Sigur", "Tajon Buchanan", "Liam Millar", "Cyle Larin", "Jonathan David"],
  mexico: ["Luis Malagón", "Johan Vasquez", "Jorge Sánchez", "Cesar Montes", "Jesus Gallardo", "Israel Reyes", "Diego Lainez", "Carlos Rodriguez", "Edson Alvarez", "Orbelin Pineda", "Marcel Ruiz", "Érick Sánchez", "Hirving Lozano", "Santiago Giménez", "Raúl Jiménez", "Alexis Vega", "Roberto Alvarado", "Cesar Huerta"],
  argentina: ["Emiliano Martinez", "Nahuel Molina", "Cristian Romero", "Nicolas Otamendi", "Nicolas Tagliafico", "Leonardo Balerdi", "Enzo Fernandez", "Alexis Mac Allister", "Rodrigo De Paul", "Exequiel Palacios", "Leandro Paredes", "Nico Paz", "Franco Mastantuono", "Nico Gonzalez", "Lionel Messi", "Lautaro Martinez", "Julian Alvarez", "Giuliano Simeone"],
  brazil: ["Alisson", "Bento", "Marquinhos", "Éder Militão", "Gabriel Magalhães", "Danilo", "Wesley", "Lucas Paquetá", "Casemiro", "Bruno Guimarães", "Luiz Henrique", "Vinicius Júnior", "Rodrygo", "João Pedro", "Matheus Cunha", "Gabriel Martinelli", "Raphinha", "Estévão"],
  uruguay: ["Sergio Rochet", "Santiago Mele", "Ronald Araujo", "José María Giménez", "Sebastian Caceres", "Mathias Olivera", "Guillermo Varela", "Nahitan Nandez", "Federico Valverde", "Giorgian De Arrascaeta", "Rodrigo Bentancur", "Manuel Ugarte", "Nicolás de la Cruz", "Maxi Araujo", "Darwin Núñez", "Federico Viñas", "Rodrigo Aguirre", "Facundo Pellistri"],
  colombia: ["Camilo Vargas", "David Ospina", "Dávinson Sánchez", "Yerry Mina", "Daniel Munoz", "Johan Mojica", "Jhon Lucumí", "Santiago Arias", "Jefferson Lerma", "Kevin Castaño", "Richard Rios", "James Rodriguez", "Juan Fernando Quintero", "Jorge Carrascal", "Jon Arias", "Jhon Cordova", "Luis Suarez", "Luis Diaz"],
  ecuador: ["Hernán Galíndez", "Gonzalo Valle", "Piero Hincapié", "Pervis Estupiñán", "Willian Pacho", "Ángelo Preciado", "Joel Ordóñez", "Moises Caicedo", "Alan Franco", "Kendry Paez", "Pedro Vite", "John Yeboah", "Leonardo Campana", "Gonzalo Plata", "Nilson Angulo", "Alan Minda", "Kevin Rodriguez", "Enner Valencia"],
  paraguay: ["Roberto Fernandez", "Orlando Gill", "Gustavo Gomez", "Fabián Balbuena", "Juan José Cáceres", "Omar Alderete", "Junior Alonso", "Mathías Villasanti", "Diego Gomez", "Damián Bobadilla", "Andres Cubas", "Matias Galarza Fonda", "Julio Enciso", "Alejandro Romero Gamarra", "Miguel Almirón", "Ramon Sosa", "Angel Romero", "Antonio Sanabria"],
  england: ["Jordan Pickford", "John Stones", "Marc Guéhi", "Ezri Konsa", "Trent Alexander-Arnold", "Reece James", "Dan Burn", "Jordan Henderson", "Declan Rice", "Jude Bellingham", "Cole Palmer", "Morgan Rogers", "Anthony Gordon", "Phil Foden", "Bukayo Saka", "Harry Kane", "Marcus Rashford", "Ollie Watkins"],
  france: ["Mike Maignan", "Theo Hernandez", "William Saliba", "Jules Kounde", "Ibrahima Konate", "Dayot Upamecano", "Lucas Digne", "Aurélien Tchouaméni", "Eduardo Camavinga", "Manu Kone", "Adrien Rabiot", "Michael Olise", "Ousmane Dembele", "Bradley Barcola", "Désiré Doué", "Kingsley Coman", "Hugo Ekitike", "Kylian Mbappe"],
  spain: ["Unai Simon", "Robin Le Normand", "Aymeric Laporte", "Dean Huijsen", "Pedro Porro", "Dani Carvajal", "Marc Cucurella", "Martín Zubimendi", "Rodri", "Pedri", "Fabian Ruiz", "Mikel Merino", "Lamine Yamal", "Dani Olmo", "Nico Williams", "Ferran Torres", "Álvaro Morata", "Mikel Oyarzabal"],
  germany: ["Marc-André ter Stegen", "Jonathan Tah", "David Raum", "Nico Schlotterbeck", "Antonio Rüdiger", "Waldemar Anton", "Ridle Baku", "Maximilian Mittelstadt", "Joshua Kimmich", "Florian Wirtz", "Felix Nmecha", "Leon Goretzka", "Jamal Musiala", "Serge Gnabry", "Kai Havertz", "Leroy Sane", "Karim Adeyemi", "Nick Woltemade"],
  portugal: ["Diogo Costa", "Jose Sa", "Ruben Dias", "João Cancelo", "Diogo Dalot", "Nuno Mendes", "Gonçalo Inácio", "Bernardo Silva", "Bruno Fernandes", "Ruben Neves", "Vitinha", "João Neves", "Cristiano Ronaldo", "Francisco Trincao", "João Felix", "Gonçalo Ramos", "Pedro Neto", "Rafael Leão"],
  netherlands: ["Bart Verbruggen", "Virgil van Dijk", "Micky van de Ven", "Jurrien Timber", "Denzel Dumfries", "Nathan Aké", "Jeremie Frimpong", "Jan Paul van Hecke", "Tijjani Reijnders", "Ryan Gravenberch", "Teun Koopmeiners", "Frenkie de Jong", "Xavi Simons", "Justin Kluivert", "Memphis Depay", "Donyell Malen", "Wout Weghorst", "Cody Gakpo"],
  belgium: ["Thibaut Courtois", "Arthur Theate", "Timothy Castagne", "Zeno Debast", "Brandon Mechele", "Maxim De Cuyper", "Thomas Meunier", "Youri Tielemans", "Amadou Onana", "Nicolas Raskin", "Alexis Saelemaekers", "Hans Vanaken", "Kevin De Bruyne", "Jérémy Doku", "Charles De Ketelaere", "Leandro Trossard", "Loïs Openda", "Romelu Lukaku"],
  croatia: ["Dominik Livaković", "Duje Caleta-Car", "Josko Gvardiol", "Josip Stanišić", "Luka Vušković", "Josip Sutalo", "Kristijan Jakic", "Luka Modrić", "Mateo Kovacic", "Martin Baturina", "Lovro Majer", "Mario Pasalic", "Petar Sucic", "Ivan Perišić", "Marco Pasalic", "Ante Budimir", "Andrej Kramarić", "Franjo Ivanovic"],
  switzerland: ["Gregor Kobel", "Yvon Mvogo", "Manuel Akanji", "Ricardo Rodriguez", "Nico Elvedi", "Aurèle Amenda", "Silvan Widmer", "Granit Xhaka", "Denis Zakaria", "Remo Freuler", "Fabian Rieder", "Ardon Jashari", "Johan Manzambi", "Michel Aebischer", "Breel Embolo", "Ruben Vargas", "Dan Ndoye", "Zeki Amdouni"],
  austria: ["Alexander Schlager", "Patrick Pentz", "David Alaba", "Kevin Danso", "Philipp Lienhart", "Stefan Posch", "Phillipp Mwene", "Alexander Prass", "Xaver Schlager", "Marcel Sabitzer", "Konrad Laimer", "Florian Grillitsch", "Nicolas Seiwald", "Romano Schmid", "Patrick Wimmer", "Christoph Baumgartner", "Michael Gregoritsch", "Marko Arnautović"],
  turkey: ["Ugurcan Cakir", "Mert Muldur", "Zeki Celik", "Abdulkerim Bardakci", "Caglar Soyuncu", "Merih Demiral", "Ferdi Kadioglu", "Kaan Ayhan", "Ismail Yuksek", "Hakan Calhanoglu", "Orkun Kokcu", "Arda Guler", "Irfan Can Kahveci", "Yunus Akgun", "Can Uzun", "Baris Alper Yilmaz", "Kerem Akturkoglu", "Kenan Yildiz"],
  czechia: ["Matej Kovar", "Jindrich Stanek", "Ladislav Krejci", "Vladimir Coufal", "Jaroslav Zeleny", "Tomas Holes", "David Zima", "Michal Sadilek", "Lukas Provod", "Lukas Cerv", "Tomas Soucek", "Pavel Sulc", "Matej Vydra", "Vasil Kusej", "Tomas Chory", "Vaclav Cerny", "Adam Hlozek", "Patrik Schick"],
  scotland: ["Angus Gunn", "Jack Hendry", "Kieran Tierney", "Aaron Hickey", "Andrew Robertson", "Scott McKenna", "John Souttar", "Anthony Ralston", "Grant Hanley", "Scott McTominay", "Billy Gilmour", "Lewis Ferguson", "Ryan Christie", "Kenny McLean", "John McGinn", "Lyndon Dykes", "Che Adams", "Ben Doak"],
  norway: ["Ørjan Nyland", "Julian Ryerson", "Leo Ostigård", "Kristoffer Vassbakk Ajer", "Marcus Holmgren Pedersen", "David Møller Wolfe", "Torbjørn Heggem", "Morten Thorsby", "Martin Ødegaard", "Sander Berge", "Andreas Schjelderup", "Patrick Berg", "Erling Haaland", "Alexander Sørloth", "Aron Dønnum", "Jorgen Strand Larsen", "Antonio Nusa", "Oscar Bobb"],
  sweden: ["Victor Johansson", "Isak Hien", "Gabriel Gudmundsson", "Emil Holm", "Victor Nilsson Lindelöf", "Gustaf Lagerbielke", "Lucas Bergvall", "Hugo Larsson", "Jesper Karlström", "Yasin Ayari", "Mattias Svanberg", "Daniel Svensson", "Ken Sema", "Roony Bardghji", "Dejan Kulusevski", "Anthony Elanga", "Alexander Isak", "Viktor Gyökeres"],
  bosnia: ["Nikola Vasilj", "Amer Dedic", "Sead Kolasinac", "Tarik Muharemovic", "Nihad Mujakic", "Nikola Katic", "Amir Hadziahmetovic", "Benjamin Tahirovic", "Armin Gigovic", "Ivan Sunjic", "Ivan Basic", "Dzenis Burnic", "Esmir Bajraktarevic", "Amar Memic", "Ermedin Demirovic", "Edin Dzeko", "Samed Bazdar", "Haris Tabakovic"],
  morocco: ["Yassine Bounou", "Munir El Kajoui", "Achraf Hakimi", "Noussair Mazraoui", "Nayef Aguerd", "Roman Saiss", "Jawad El Yamio", "Adam Masina", "Sofyan Amrabat", "Azzedine Ounahi", "Eliesse Ben Seghir", "Bilal El Khannouss", "Ismael Saibari", "Youssef En-Nesyri", "Abde Ezzalzouli", "Soufiane Rahimi", "Brahim Diaz", "Ayoub El Kaabi"],
  senegal: ["Edouard Mendy", "Yehvann Diouf", "Moussa Niakhaté", "Abdoulaye Seck", "Ismail Jakobs", "El Hadji Malick Diouf", "Kalidou Koulibaly", "Idrissa Gana Gueye", "Pape Matar Sarr", "Pape Gueye", "Habib Diarra", "Lamine Camara", "Sadio Mane", "Ismaïla Sarr", "Boulaye Dia", "Iliman Ndiaye", "Nicolas Jackson", "Krepin Diatta"],
  algeria: ["Alexis Guendouz", "Ramy Bensebaini", "Youcef Atal", "Rayan Aït-Nouri", "Mohamed Amine Tougai", "Aïssa Mandi", "Ismael Bennacer", "Houssem Aquar", "Hicham Boudaoui", "Ramiz Zerrouki", "Nabil Bentalab", "Farés Chaibi", "Riyad Mahrez", "Said Benrahma", "Anis Hadj Moussa", "Amine Gouiri", "Baghdad Bounedjah", "Mohammed Amoura"],
  capeverde: ["Vozinha", "Logan Costa", "Pico", "Diney", "Steven Moreira", "Wagner Pina", "Joao Paulo", "Yannick Semedo", "Kevin Pina", "Patrick Andrade", "Jamiro Monteiro", "Deroy Duarte", "Garry Rodrigues", "Jovane Cabral", "Ryan Mendes", "Dailon Livramento", "Willy Semedo", "Bebe"],
  egypt: ["Mohamed El Shenawy", "Mohamed Hany", "Mohamed Hamdy", "Yasser Ibrahim", "Khaled Sobhi", "Ramy Rabia", "Hossam Abdelmaguid", "Ahmed Fatouh", "Marwan Attia", "Zizo", "Hamdy Fathy", "Mohamed Lasheen", "Emam Ashour", "Osama Faisal", "Mohamed Salah", "Mostafa Mohamed", "Trezeguet", "Omar Marmoush"],
  ghana: ["Lawrence Ati Zigi", "Tariq Lamptey", "Mohammed Salisu", "Alidu Seidu", "Alexander Djiku", "Gideon Mensah", "Caleb Yirenkyi", "Abdul Issahaku Fatawu", "Thomas Partey", "Salis Abdul Samed", "Kamaldeen Sulemana", "Mohammed Kudus", "Inaki Williams", "Jordan Ayew", "Andrew Ayew", "Joseph Paintsil", "Osman Bukari", "Antoine Semenyo"],
  ivorycoast: ["Yahia Fofana", "Ghislain Konan", "Wilfried Singo", "Odilon Kossounou", "Evan Ndicka", "Willy Boly", "Emmanuel Agbadou", "Ousmane Diomande", "Franck Kessie", "Seko Fofana", "Ibrahim Sangare", "Jean-Philippe Gbamin", "Amad Diallo", "Sébastien Haller", "Simon Adingra", "Yan Diomande", "Evann Guessand", "Oumar Diakite"],
  southafrica: ["Ronwen Williams", "Sipho Chaine", "Aubrey Modiba", "Samukele Kabini", "Mbekezeli Mbokazi", "Khulumani Ndamane", "Siyabonga Ngezana", "Khuliso Mudau", "Nkosinathi Sibisi", "Teboho Mokoena", "Thalente Mbatha", "Bathasi Aubaas", "Yaya Sithole", "Sipho Mbule", "Lyle Foster", "Iqraam Rayners", "Mohau Nkota", "Oswin Appollis"],
  tunisia: ["Bechir Ben Said", "Aymen Dahmen", "Yan Valery", "Montassar Talbi", "Yassine Meriah", "Ali Abdi", "Dylan Bronn", "Ellyes Skhiri", "Aissa Laidouni", "Ferjani Sassi", "Mohamed Ali Ben Romdhane", "Hannibal Mejbri", "Elias Achouri", "Elias Saad", "Hazem Mastouri", "Ismael Gharbi", "Sayfallah Ltaief", "Naim Sliti"],
  drcongo: ["Lionel Mpasi", "Aaron Wan-Bissaka", "Axel Tuanzebe", "Arthur Masuaku", "Chancel Mbemba", "Joris Kayembe", "Charles Pickel", "Ngal'ayel Mukau", "Edo Kayembe", "Samuel Moutoussamy", "Noah Sadiki", "Théo Bongonda", "Meschak Elia", "Yoane Wissa", "Brian Cipenga", "Fiston Mayele", "Cédric Bakambu", "Nathanaël Mbuku"],
  japan: ["Zion Suzuki", "Henry Hiroki Mochizuki", "Ayumu Seko", "Junnosuke Suzuki", "Shogo Taniguchi", "Tsuyoshi Watanabe", "Kaishu Sano", "Yuki Soma", "Ao Tanaka", "Daichi Kamada", "Takefusa Kubo", "Ritsu Doan", "Keito Nakamura", "Takumi Minamino", "Shuto Machino", "Junya Ito", "Koki Ogawa", "Ayase Ueda"],
  southkorea: ["Hyeon-woo Jo", "Seung-Gyu Kim", "Min-jae Kim", "Yu-min Cho", "Young-woo Seol", "Han-beom Lee", "Tae-seok Lee", "Myung-jae Lee", "Jae-sung Lee", "In-beom Hwang", "Kang-in Lee", "Seung-ho Paik", "Jens Castrop", "Dong-yeong Lee", "Gue-sung Cho", "Heung-min Son", "Hee-chan Hwang", "Hyeon-Gyu Oh"],
  australia: ["Mathew Ryan", "Joe Gauci", "Harry Souttar", "Alessandro Circati", "Jordan Bos", "Aziz Behich", "Cameron Burgess", "Lewis Miller", "Milos Degenek", "Jackson Irvine", "Riley McGree", "Aiden O'Neill", "Connor Metcalfe", "Patrick Yazbek", "Craig Goodwin", "Kusini Yengi", "Nestory Irankunda", "Mohamed Touré"],
  iran: ["Alireza Beiranvand", "Morteza Pouraliganji", "Ehsan Hajsafi", "Milad Mohammadi", "Shojae Khalilzadeh", "Ramin Rezaeian", "Hossein Kanaani", "Sadegh Moharrami", "Saleh Hardani", "Saeed Ezatolahi", "Saman Ghoddos", "Omid Noorafkan", "Roozbeh Cheshmi", "Mohammad Mohebi", "Sardar Azmoun", "Mehdi Taremi", "Alireza Jahanbakhsh", "Ali Gholizadeh"],
  saudiarabia: ["Nawaf Alaqidi", "Abdulrahman Al-Sanbi", "Saud Abdulhamid", "Nawaf Bouwashl", "Jihad Thakri", "Moteb Al-Harbi", "Hassan Altambakti", "Musab Aljuwayr", "Ziyad Aljohani", "Abdullah Alkhaibari", "Nasser Aldawsari", "Saleh Abu Alshamat", "Marwan Alsahafi", "Salem Aldawsari", "Abdulrahman Al-Aboud", "Feras Akbrikan", "Saleh Alshehri", "Abdullah Al-Hamdan"],
  qatar: ["Meshaal Barsham", "Sultan Albrake", "Lucas Mendes", "Homam Ahmed", "Boualem Khoukhi", "Pedro Miguel", "Tarek Salman", "Mohamed Al-Mannai", "Karim Boudiaf", "Assim Madibo", "Ahmed Fatehi", "Mohammed Waad", "Abdulaziz Hatem", "Hassan Al-Haydos", "Edmilson Junior", "Akram Hassan Afif", "Ahmed Al Ganehi", "Almoez Ali"],
  jordan: ["Yazeed Abulaila", "Ihsan Haddad", "Mohammad Abu Hashish", "Yazan Al-Arab", "Abdallah Nasib", "Saleem Obaid", "Mohammad Abualnadi", "Ibrahim Saadeh", "Nizar Al-Rashdan", "Noor Al-Rawabdeh", "Mohannad Abu Taha", "Amer Jamous", "Musa Al-Taamari", "Yazan Al-Naimat", "Mahmoud Al-Mardi", "Ali Olwan", "Mohammad Abu Zrayq", "Ibrahim Sabra"],
  uzbekistan: ["Utkir Yusupov", "Farrukh Sayfiev", "Sherzod Nasrullaev", "Umar Eshmurodov", "Husniddin Aliqulov", "Rustamjon Ashurmatov", "Khojiakbar Alijonov", "Abdukodir Khusanov", "Odiljon Hamrobekov", "Otabek Shukurov", "Jamshid Iskanderov", "Azizbek Turgunboev", "Khojimat Erkinov", "Eldor Shomurodov", "Oston Urunov", "Jaloliddin Masharipov", "Igor Sergeev", "Abbosbek Fayzullaev"],
  iraq: ["Jalal Hassan", "Rebin Sulaka", "Hussein Ali", "Akam Hashem", "Merchas Doski", "Zaid Tahseen", "Manaf Younis", "Zidane Iqbal", "Amir Al-Ammari", "Ibrahim Bavesh", "Ali Jasim", "Youssef Amyn", "Aimar Sher", "Marko Farji", "Osama Rashid", "Ali Al-Hamadi", "Aymen Hussein", "Mohanad Ali"],
  panama: ["Orlando Mosquera", "Luis Mejia", "Fidel Escobar", "Andres Andrade", "Michael Amir Murillo", "Eric Davis", "Jose Cordoba", "Cesar Blackman", "Cristian Martinez", "Aníbal Godoy", "Adalberto Carrasquilla", "Édgar Bárcenas", "Carlos Harvey", "Ismael Díaz", "Jose Fajardo", "Cecilio Waterman", "Jose Luiz Rodriguez", "Alberto Quintero"],
  curacao: ["Eloy Room", "Armando Obispo", "Sherel Floranus", "Jurien Gaari", "Joshua Brenet", "Roshon Van Eijma", "Shurandy Sambo", "Livano Comenencia", "Godfried Roemeratoe", "Juninho Bacuna", "Leandro Bacuna", "Tahith Chong", "Kenji Gorre", "Jearl Margaritha", "Jurgen Locadia", "Jeremy Antonisse", "Gervane Kastaneer", "Sontje Hansen"],
  haiti: ["Johny Placide", "Carlens Arcus", "Martin Expérience", "Jean-Kevin Duverne", "Ricardo Adé", "Duke Lacroix", "Garven Metusala", "Hannes Delcroix", "Leverton Pierre", "Danley Jean Jacques", "Jean-Ricner Bellegarde", "Christopher Attys", "Derrick Etienne Jr", "Josue Casimir", "Ruben Providence", "Duckens Nazon", "Louicius Deedson", "Frantzdy Pierrot"],
  newzealand: ["Max Crocombe Payne", "Alex Paulsen", "Michael Boxall", "Liberato Cacace", "Tim Payne", "Tyler Bindon", "Francis de Vries", "Finn Surman", "Joe Bell", "Sarpreet Singh", "Ryan Thomas", "Matthew Garbett", "Marko Stamenić", "Ben Old", "Chris Wood", "Elijah Just", "Callum McCowatt", "Kosta Barbarouses"],
};

function buildTeams(): NewTeam[] {
  return TEAMS.map((t, i) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    flagCode: FLAG_CODES[t.id] ?? "xx",
    color: t.color,
    confederation: t.conf,
    confName: t.confName,
    sortOrder: i,
  }));
}

function buildStickers(): NewSticker[] {
  const rows: NewSticker[] = [];

  for (const team of TEAMS) {
    const roster = PLAYERS[team.id];
    if (!roster) continue;
    roster.forEach((playerName, idx) => {
      rows.push({
        id: `${team.code}-${idx + 1}`,
        teamId: team.id,
        playerName,
        position: idx + 1,
        isFoil: false,
        section: "team",
        icon: null,
      });
    });
  }

  for (const section of SPECIAL_SECTIONS) {
    section.stickers.forEach((s, idx) => {
      rows.push({
        id: s.id,
        teamId: null,
        playerName: s.label,
        position: idx + 1,
        isFoil: s.foil,
        section: section.id,
        icon: s.icon,
      });
    });
  }

  return rows;
}

function buildCollection(stickerRows: NewSticker[]): NewCollectionEntry[] {
  return stickerRows.map((s) => ({
    stickerId: s.id,
    status: "missing",
    quantity: 0,
  }));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  try {
    const teamRows = buildTeams();
    const stickerRows = buildStickers();
    const collectionRows = buildCollection(stickerRows);

    console.log(
      `Seeding ${teamRows.length} teams, ${stickerRows.length} stickers, ${collectionRows.length} collection entries…`,
    );

    await db.insert(teams).values(teamRows).onConflictDoNothing();
    await db.insert(stickers).values(stickerRows).onConflictDoNothing();
    await db.insert(collection).values(collectionRows).onConflictDoNothing();

    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@panini.local";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const insertedUsers = await db
      .insert(users)
      .values({ email: adminEmail, password: passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    if (insertedUsers.length > 0) {
      console.log(`Seeded admin user: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    console.log("Seed complete");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main();
