/**
 * What every thing in the world is for (imad 2026-11-26: "every item in the sim should be defined with a phrase, and people must
 * be aware of its benefits and how to use it"). ONE table for the server (the AI people's prompts: sim/knowhow.ts) and the TV
 * (the bag screen shows the phrase): what it gives you, then how you get it / use it.
 */
import type { L } from './quests.js';

export interface ItemInfo {
  /** One phrase: the benefit, then how to use it. */
  text: L;
  /** What kind of thing it is (groups the know-how list). */
  kind: 'material' | 'food' | 'weapon' | 'wear' | 'healing' | 'defence' | 'furniture' | 'building' | 'animal';
}

export const ITEM_INFO: Record<string, ItemInfo> = {
  // ---------------------------------------------------------------- materials
  wood: { kind: 'material', text: {
    en: 'Wood: the most used material (fires, huts, walls, weapons, beds). Chop a tree to get it; an axe gives 2 a blow.',
    fr: 'Bois : le matériau le plus utilisé (feux, cabanes, murs, armes, lits). Coupez un arbre ; une hache en donne 2 par coup.',
    es: 'Madera: el material más usado (fuegos, cabañas, muros, armas, camas). Tala un árbol; con un hacha da 2 por golpe.',
    ar: 'الخشب: أكثر مادة استعمالاً (نار، أكواخ، أسوار، أسلحة، أسرّة). اقطع شجرة؛ الفأس يعطي 2 في كل ضربة.' } },
  stone: { kind: 'material', text: {
    en: 'Stone: for axes, arrows, campfires and huts. Search rubble or mine a rock.',
    fr: 'Pierre : pour les haches, les flèches, les feux et les cabanes. Fouillez les gravats ou cassez un rocher.',
    es: 'Piedra: para hachas, flechas, fogatas y cabañas. Busca en los escombros o pica una roca.',
    ar: 'الحجر: للفؤوس والسهام والنار والأكواخ. ابحث في الأنقاض أو اكسر صخرة.' } },
  scrap: { kind: 'material', text: {
    en: 'Scrap metal: for spears, windows, lamps and better gear. Found searching rubble and ruins.',
    fr: 'Ferraille : pour les lances, fenêtres, lampes et un meilleur équipement. Se trouve dans les gravats et les ruines.',
    es: 'Chatarra: para lanzas, ventanas, lámparas y mejor equipo. Se encuentra en escombros y ruinas.',
    ar: 'الخردة: للرماح والنوافذ والمصابيح وتحسين العتاد. توجد في الأنقاض والخرائب.' } },
  ore: { kind: 'material', text: {
    en: 'Ore: metal for swords, armour, helmets, doors and lamps, and to level gear up. Mine rocks (1 in 10 blows).',
    fr: 'Minerai : du métal pour épées, armures, casques, portes et lampes, et pour améliorer l\'équipement. Cassez des rochers.',
    es: 'Mineral: metal para espadas, armaduras, cascos, puertas y lámparas, y para mejorar el equipo. Pica rocas.',
    ar: 'الخام: معدن للسيوف والدروع والخوذ والأبواب والمصابيح ولرفع مستوى العتاد. اكسر الصخور.' } },
  brick: { kind: 'material', text: {
    en: 'Bricks: for stone walls (the strongest defence) and the best gear quality. Search rubble.',
    fr: 'Briques : pour les murs de pierre (la meilleure défense) et la meilleure qualité d\'équipement. Fouillez les gravats.',
    es: 'Ladrillos: para muros de piedra (la mejor defensa) y la mejor calidad de equipo. Busca en los escombros.',
    ar: 'الطوب: للأسوار الحجرية (أقوى دفاع) ولأعلى جودة للعتاد. ابحث في الأنقاض.' } },
  leather: { kind: 'material', text: {
    en: 'Leather: for clothes, bows, beds, huts and first-aid kits. Hunt animals to get it (scarce: hunt often).',
    fr: 'Cuir : pour les vêtements, arcs, lits, cabanes et trousses de soins. Chassez des animaux (rare : chassez souvent).',
    es: 'Cuero: para ropa, arcos, camas, cabañas y botiquines. Caza animales (escaso: caza a menudo).',
    ar: 'الجلد: للملابس والأقواس والأسرّة والأكواخ وحقائب الإسعاف. اصطد الحيوانات (نادر: اصطد كثيراً).' } },
  claw: { kind: 'material', text: {
    en: 'Claws: for spears and spikes, and to raise gear quality. Hunt wolves and bears.',
    fr: 'Griffes : pour les lances et les pieux, et pour la qualité de l\'équipement. Chassez loups et ours.',
    es: 'Garras: para lanzas y pinchos, y para subir la calidad del equipo. Caza lobos y osos.',
    ar: 'المخالب: للرماح والأوتاد ولرفع جودة العتاد. اصطد الذئاب والدببة.' } },
  herb: { kind: 'material', text: {
    en: 'Healing herbs: 3 herbs + 1 leather make a first-aid kit. Pick them from the leafy patches by the trees.',
    fr: 'Herbes médicinales : 3 herbes + 1 cuir = une trousse de soins. Cueillez-les dans les touffes près des arbres.',
    es: 'Hierbas medicinales: 3 hierbas + 1 cuero = un botiquín. Recógelas en las matas junto a los árboles.',
    ar: 'الأعشاب الطبية: 3 أعشاب + 1 جلد = حقيبة إسعاف. اقطفها من الشجيرات قرب الأشجار.' } },
  // ---------------------------------------------------------------- food
  food: { kind: 'food', text: {
    en: 'Food (berries, cans, meat): eat it when hungry or nobody lasts; 5 in the hands, more in the bag; keep a stock in your fridge or the camp\'s store.',
    fr: 'Nourriture (baies, conserves, viande) : mangez quand vous avez faim ; 5 en main, le reste dans le sac ; gardez-en au frigo ou dans la réserve du camp.',
    es: 'Comida (bayas, latas, carne): come cuando tengas hambre; 5 en las manos, más en la bolsa; guarda reservas en tu nevera o en el almacén.',
    ar: 'الطعام (توت، معلبات، لحم): كُل عند الجوع؛ 5 في اليدين والباقي في الحقيبة؛ احتفظ بمخزون في ثلاجتك أو مخزن المخيم.' } },
  water: { kind: 'food', text: {
    en: 'Water bottles: drink when thirsty far from the water. Fill 3 at the water\'s edge (when not thirsty); keep some in your fridge.',
    fr: 'Bouteilles d\'eau : buvez quand vous avez soif loin de l\'eau. Remplissez-en 3 au bord de l\'eau (sans soif) ; gardez-en au frigo.',
    es: 'Botellas de agua: bebe cuando tengas sed lejos del agua. Llena 3 en la orilla (sin sed); guarda algunas en tu nevera.',
    ar: 'قوارير الماء: اشرب عند العطش بعيداً عن الماء. املأ 3 عند حافة الماء (بلا عطش)؛ احتفظ ببعضها في ثلاجتك.' } },
  meat: { kind: 'food', text: {
    en: 'Meat: food from a hunted animal (it fills you well). Eat it or put it in the camp\'s store.',
    fr: 'Viande : de la nourriture d\'un animal chassé (elle cale bien). Mangez-la ou mettez-la dans la réserve.',
    es: 'Carne: comida de un animal cazado (llena bien). Cómela o guárdala en el almacén.',
    ar: 'اللحم: طعام من حيوان مُصطاد (يُشبع جيداً). كُله أو ضعه في مخزن المخيم.' } },
  // ---------------------------------------------------------------- weapons
  sword: { kind: 'weapon', text: {
    en: 'Sword: the strongest weapon (damage 34) against zombies and beasts. Carry it: you fight with it by yourself.',
    fr: 'Épée : l\'arme la plus forte (dégâts 34) contre zombies et bêtes. Portez-la : vous vous battez avec.',
    es: 'Espada: el arma más fuerte (daño 34) contra zombis y bestias. Llévala: luchas con ella sola.',
    ar: 'السيف: أقوى سلاح (ضرر 34) ضد الزومبي والوحوش. احمله وستقاتل به تلقائياً.' } },
  spear: { kind: 'weapon', text: {
    en: 'Spear: a strong weapon (damage 30) for fights and hunting boars, wolves and bears. Carry it.',
    fr: 'Lance : une arme forte (dégâts 30) pour se battre et chasser sangliers, loups et ours. Portez-la.',
    es: 'Lanza: un arma fuerte (daño 30) para luchar y cazar jabalíes, lobos y osos. Llévala.',
    ar: 'الرمح: سلاح قوي (ضرر 30) للقتال وصيد الخنازير والذئاب والدببة. احمله.' } },
  axe: { kind: 'weapon', text: {
    en: 'Axe: chops trees for 2 wood a blow and is a weapon too (damage 22). Carry it.',
    fr: 'Hache : coupe les arbres (2 bois par coup) et sert aussi d\'arme (dégâts 22). Portez-la.',
    es: 'Hacha: tala árboles (2 de madera por golpe) y también es un arma (daño 22). Llévala.',
    ar: 'الفأس: يقطع الأشجار (2 خشب في الضربة) وهو سلاح أيضاً (ضرر 22). احمله.' } },
  bow: { kind: 'weapon', text: {
    en: 'Bow: shoots arrows from afar (up to 22 m, damage 30 near) so prey and zombies never reach you. Needs arrows; aim and shoot.',
    fr: 'Arc : tire des flèches de loin (22 m, dégâts 30 de près) : proies et zombies ne vous atteignent pas. Il faut des flèches ; visez et tirez.',
    es: 'Arco: dispara flechas de lejos (22 m, daño 30 de cerca): presas y zombis no te alcanzan. Necesita flechas; apunta y dispara.',
    ar: 'القوس: يرمي السهام من بعيد (حتى 22 م، ضرر 30 عن قرب) فلا تصلك الفريسة ولا الزومبي. يحتاج سهاماً؛ صوّب وارمِ.' } },
  arrows: { kind: 'weapon', text: {
    en: 'Arrows: one is used up each bow shot. 2 wood + 1 stone make 5.',
    fr: 'Flèches : une par tir à l\'arc. 2 bois + 1 pierre en font 5.',
    es: 'Flechas: se gasta una por disparo. 2 de madera + 1 piedra hacen 5.',
    ar: 'السهام: يُستهلك سهم في كل رمية. 2 خشب + 1 حجر = 5 سهام.' } },
  // ---------------------------------------------------------------- wear
  clothes: { kind: 'wear', text: {
    en: 'Leather clothes: keep 45 % of the cold off (under 5 °C standing still hurts) and bites and blows hurt 15 % less. Wear them (carried = worn).',
    fr: 'Vêtements de cuir : protègent de 45 % du froid (sous 5 °C rester immobile fait mal) et morsures et coups font 15 % de moins. Portez-les.',
    es: 'Ropa de cuero: quita el 45 % del frío (bajo 5 °C quedarse quieto hace daño) y mordiscos y golpes hacen un 15 % menos. Llévala puesta.',
    ar: 'ملابس جلدية: تقي من 45 % من البرد (تحت 5 درجات يؤذيك الوقوف بلا حركة) والعضّات والضربات تؤلم أقل بـ15 %. البسها.' } },
  armor: { kind: 'wear', text: {
    en: 'Armour: bites and blows hurt 35 % less, the best body protection; keeps 30 % of the cold off. Wear it.',
    fr: 'Armure : morsures et coups font 35 % de moins, la meilleure protection ; protège de 30 % du froid. Portez-la.',
    es: 'Armadura: mordiscos y golpes hacen un 35 % menos, la mejor protección; quita el 30 % del frío. Llévala puesta.',
    ar: 'الدرع: العضّات والضربات تؤلم أقل بـ35 %، أفضل حماية للجسم؛ يقي من 30 % من البرد. البسه.' } },
  helmet: { kind: 'wear', text: {
    en: 'Helmet: 15 % less damage on top of clothes or armour. Wear it.',
    fr: 'Casque : 15 % de dégâts en moins, en plus des vêtements ou de l\'armure. Portez-le.',
    es: 'Casco: 15 % menos de daño, además de la ropa o la armadura. Llévalo puesto.',
    ar: 'الخوذة: ضرر أقل بـ15 % فوق الملابس أو الدرع. البسها.' } },
  // ---------------------------------------------------------------- healing
  medkit: { kind: 'healing', text: {
    en: 'First-aid kit: gives back 45 health at once. Use it when badly hurt (3 herbs + 1 leather).',
    fr: 'Trousse de soins : rend 45 de santé d\'un coup. Utilisez-la quand vous êtes très blessé (3 herbes + 1 cuir).',
    es: 'Botiquín: devuelve 45 de salud de golpe. Úsalo cuando estés muy herido (3 hierbas + 1 cuero).',
    ar: 'حقيبة الإسعاف: تعيد 45 من الصحة دفعة واحدة. استعملها عند الإصابة الشديدة (3 أعشاب + 1 جلد).' } },
  // ---------------------------------------------------------------- defences
  palisade: { kind: 'defence', text: {
    en: 'Palisade: a wooden wall zombies and beasts must claw through. Build a ring of them round the camp.',
    fr: 'Palissade : un mur de bois que zombies et bêtes doivent griffer pour passer. Faites-en un cercle autour du camp.',
    es: 'Empalizada: un muro de madera que zombis y bestias deben arañar para pasar. Haz un anillo alrededor del campamento.',
    ar: 'السياج الخشبي: جدار يجب على الزومبي والوحوش خدشه ليعبروا. ابنِ حلقة منه حول المخيم.' } },
  spikes: { kind: 'defence', text: {
    en: 'Spikes: hurt every zombie that walks into them. Put them outside the camp wall.',
    fr: 'Pieux : blessent chaque zombie qui s\'y frotte. Posez-les devant le mur du camp.',
    es: 'Pinchos: hieren a cada zombi que los toca. Ponlos fuera del muro del campamento.',
    ar: 'الأوتاد: تجرح كل زومبي يصطدم بها. ضعها خارج سور المخيم.' } },
  stonewall: { kind: 'defence', text: {
    en: 'Stone wall: the strongest wall (takes half damage). Build it from bricks where zombies come in.',
    fr: 'Mur de pierre : le mur le plus solide (moitié des dégâts). Construisez-le en briques là où les zombies entrent.',
    es: 'Muro de piedra: el más fuerte (recibe la mitad del daño). Hazlo con ladrillos donde entran los zombis.',
    ar: 'السور الحجري: أقوى جدار (يتلقى نصف الضرر). ابنه من الطوب حيث يدخل الزومبي.' } },
  // ---------------------------------------------------------------- furniture
  door: { kind: 'furniture', text: {
    en: 'Door: people pass, zombies and animals do not; a home\'s door opens only for its family. Put it in a doorway; open / close it.',
    fr: 'Porte : les gens passent, pas les zombies ni les animaux ; celle d\'une maison ne s\'ouvre qu\'à sa famille. Dans une embrasure ; ouvrez / fermez.',
    es: 'Puerta: la gente pasa, zombis y animales no; la de una casa solo se abre a su familia. En un umbral; ábrela / ciérrala.',
    ar: 'الباب: يعبره الناس لا الزومبي ولا الحيوانات؛ باب البيت لا يُفتح إلا لأهله. ضعه في المدخل؛ افتحه / أغلقه.' } },
  window: { kind: 'furniture', text: {
    en: 'Window: a piece of wall that lets light in; nobody passes. Put it in a hut wall.',
    fr: 'Fenêtre : un morceau de mur qui laisse entrer la lumière ; personne ne passe. Dans un mur de cabane.',
    es: 'Ventana: un trozo de muro que deja pasar la luz; nadie pasa. En un muro de cabaña.',
    ar: 'النافذة: قطعة جدار تُدخل الضوء ولا يعبرها أحد. ضعها في جدار كوخ.' } },
  bed: { kind: 'furniture', text: {
    en: 'Bed: sleep and rest twice as well, safely under a roof. Put it inside your hut and sleep there.',
    fr: 'Lit : dormir et se reposer deux fois mieux, à l\'abri. Posez-le dans votre cabane et dormez-y.',
    es: 'Cama: duermes y descansas el doble de bien, bajo techo. Ponla en tu cabaña y duerme allí.',
    ar: 'السرير: نوم وراحة مضاعفان تحت سقف آمن. ضعه داخل كوخك ونم فيه.' } },
  lamp: { kind: 'furniture', text: {
    en: 'Lamp: lights the night and keeps zombies 3 m away and animals off. Put it at the camp or by your door.',
    fr: 'Lampe : éclaire la nuit, tient les zombies à 3 m et les animaux à l\'écart. Au camp ou près de votre porte.',
    es: 'Lámpara: ilumina la noche y mantiene a los zombis a 3 m y a los animales lejos. En el campamento o junto a tu puerta.',
    ar: 'المصباح: يضيء الليل ويُبعد الزومبي 3 م والحيوانات. ضعه في المخيم أو قرب بابك.' } },
  campfire: { kind: 'furniture', text: {
    en: 'Campfire: within 6 m the cold cannot hurt you and wounds heal faster; zombies and beasts keep away and sleep near it rests you 1.5x. Burns 10 h; add wood to keep it going.',
    fr: 'Feu de camp : à moins de 6 m le froid ne fait plus mal et les blessures guérissent plus vite ; zombies et bêtes l\'évitent et dormir près de lui repose 1,5 fois mieux. Brûle 10 h ; ajoutez du bois.',
    es: 'Fogata: a menos de 6 m el frío no hace daño y las heridas sanan más rápido; zombis y bestias se alejan y dormir cerca descansa 1,5 veces más. Arde 10 h; añade madera.',
    ar: 'نار المخيم: على بعد 6 م لا يؤذيك البرد وتلتئم الجروح أسرع؛ يبتعد عنها الزومبي والوحوش والنوم قربها يريح 1.5 مرة. تشتعل 10 ساعات؛ أضف الخشب.' } },
  fridge: { kind: 'furniture', text: {
    en: 'Fridge: keeps food and water for the days to come (40 of each). Build it inside your hut (3 scrap + 2 stone) and fill it.',
    fr: 'Frigo : garde nourriture et eau pour les jours à venir (40 de chaque). À construire dans votre cabane (3 ferraille + 2 pierres) puis à remplir.',
    es: 'Nevera: guarda comida y agua para los días que vienen (40 de cada). Constrúyela dentro de tu cabaña (3 chatarra + 2 piedra) y llénala.',
    ar: 'الثلاجة: تحفظ الطعام والماء للأيام القادمة (40 من كل). ابنها داخل كوخك (3 خردة + 2 حجر) واملأها.' } },
  chest: { kind: 'furniture', text: {
    en: 'Chest: keeps materials, tools, weapons and clothes safe at home (40 of each). Build it inside your hut (4 wood + 1 scrap).',
    fr: 'Coffre : garde matériaux, outils, armes et vêtements à la maison (40 de chaque). À construire dans votre cabane (4 bois + 1 ferraille).',
    es: 'Cofre: guarda materiales, herramientas, armas y ropa en casa (40 de cada). Constrúyelo dentro de tu cabaña (4 madera + 1 chatarra).',
    ar: 'الصندوق: يحفظ المواد والأدوات والأسلحة والملابس في البيت (40 من كل). ابنه داخل كوخك (4 خشب + 1 خردة).' } },
  // ---------------------------------------------------------------- buildings
  hut: { kind: 'building', text: {
    en: 'Hut: a home with a roof and its own door (7 x 7, room for a fridge and a chest), where your family sleeps safe; inside, the cold is 80 % weaker. 20 wood + 10 stone + 5 leather; build it next to the other huts of the camp (close together = easier to defend).',
    fr: 'Cabane : une maison avec un toit et sa porte, où votre famille dort en sécurité ; dedans, le froid est 80 % plus faible. 20 bois + 10 pierres + 5 cuirs, à côté des autres cabanes du camp (serrées = plus faciles à défendre).',
    es: 'Cabaña: un hogar con techo y su propia puerta, donde tu familia duerme a salvo; dentro, el frío es un 80 % más débil. 20 madera + 10 piedra + 5 cuero, junto a las otras cabañas del campamento (juntas = más fáciles de defender).',
    ar: 'الكوخ: بيت بسقف وباب خاص تنام فيه عائلتك بأمان؛ في داخله يضعف البرد 80 %. 20 خشب + 10 حجر + 5 جلد؛ ابنه بجانب أكواخ المخيم الأخرى (المتقاربة أسهل في الدفاع).' } },
  house: { kind: 'building', text: {
    en: 'Big house: twice the room of a hut (9 x 9, a 7 x 7 room under one roof) with its own door, for a big family: beds, fridges and chests for everyone. 20 wood + 20 stone + 10 leather + 6 bricks.',
    fr: 'Grande maison : deux fois la place d\'une cabane (9 x 9, une pièce de 7 x 7 sous un toit) avec sa porte, pour une grande famille : des lits, frigos et coffres pour tous. 20 bois + 20 pierres + 10 cuirs + 6 briques.',
    es: 'Casa grande: el doble de sitio que una cabaña (9 x 9, una sala de 7 x 7 bajo un techo) con su puerta, para una familia grande: camas, neveras y cofres para todos. 20 madera + 20 piedra + 10 cuero + 6 ladrillos.',
    ar: 'البيت الكبير: ضعف مساحة الكوخ (9 × 9، غرفة 7 × 7 تحت سقف واحد) بباب خاص، لعائلة كبيرة: أسرّة وثلاجات وصناديق للجميع. 20 خشب + 20 حجر + 10 جلد + 6 طوب.' } },
  crate: { kind: 'building', text: {
    en: 'The camp\'s store: food, wood, stone and scrap kept for everyone. Put what you carry in it, take from it when in need.',
    fr: 'La réserve du camp : nourriture, bois, pierre et ferraille pour tous. Déposez-y ce que vous portez, prenez-y en cas de besoin.',
    es: 'El almacén del campamento: comida, madera, piedra y chatarra para todos. Deja lo que llevas, toma cuando lo necesites.',
    ar: 'مخزن المخيم: طعام وخشب وحجر وخردة للجميع. ضع فيه ما تحمله وخذ منه عند الحاجة.' } },
  farm: { kind: 'building', text: {
    en: 'Field: grows berries every 12 hours for the camp. Plant one near the camp and pick what grows.',
    fr: 'Champ : donne des baies toutes les 12 heures pour le camp. Plantez-en un près du camp et cueillez.',
    es: 'Campo: da bayas cada 12 horas para el campamento. Planta uno cerca del campamento y recoge.',
    ar: 'الحقل: ينبت التوت كل 12 ساعة للمخيم. ازرع واحداً قرب المخيم واقطف ما ينمو.' } },
  // ---------------------------------------------------------------- animals
  horse: { kind: 'animal', text: {
    en: 'Horse: carries you 3-5 times faster than walking (gallop) and through the gates in seconds. Tame a wild one calmly, call yours, get on for long ways.',
    fr: 'Cheval : vous porte 3 à 5 fois plus vite qu\'à pied (galop) et passe les portes en quelques secondes. Apprivoisez-en un calmement, appelez le vôtre, montez pour les longs trajets.',
    es: 'Caballo: te lleva 3-5 veces más rápido que a pie (galope) y cruza las puertas en segundos. Doma uno con calma, llama al tuyo, móntalo para los caminos largos.',
    ar: 'الحصان: يحملك أسرع من المشي بثلاث إلى خمس مرات (عدْو) ويعبر البوابات في ثوانٍ. روّض حصاناً برفق، نادِ حصانك واركبه للمسافات الطويلة.' } },
};

/** The phrase for a thing in a language ('' = nothing known). */
export function itemText(id: string, lang: string = 'en'): string {
  const i = ITEM_INFO[id];
  if (!i) return '';
  return i.text[(lang in i.text ? lang : 'en') as keyof L] || i.text.en;
}
