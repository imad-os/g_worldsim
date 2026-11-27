/**
 * Quests and the town's teachers (imad 2026-11-25: "a quest system with NPCs, 10 quests to introduce players and AI people to
 * the game and how to play; AI people learn from them"). ONE table for the server (sim/quests.ts) and the TV (texts in 4 languages).
 *
 * The NPCs are not people (imad 2026-11-25): they stand in town, never eat, age, marry, fight or join clans.
 * A quest is taken from its NPC, done in the world (counted from what really happens: a drink, a chopped tree, a crafted axe...)
 * and handed in to the same NPC: then the reward, and its lesson goes into the person's memory for good.
 * The 10 come in order: the next one opens when the one before is handed in.
 */
export type Lang = 'en' | 'fr' | 'es' | 'ar';
export type L = Record<Lang, string>;

export const NPC_KEYS = ['guide', 'smith', 'hunter', 'warden', 'registrar', 'mayor', 'healer', 'farmer', 'ranger', 'builder'] as const;
export type NpcKey = (typeof NPC_KEYS)[number];

export interface NpcDef {
  key: NpcKey;
  name: string;
  /** Look as for players' characters: 1 + skin tone 0-4, + 8 for a woman. */
  look: number;
  /** Where they stand: offset in metres from the middle of their map. */
  dx: number; dy: number;
  /** Their map's id (none = the start map, Old Town). Ridgeford's teachers (imad 2026-11-27) give quests 12-20. */
  map?: string;
  title: L;
  /** What they say when there is nothing for you. */
  idle: L;
}

export const NPCS: NpcDef[] = [
  { key: 'guide', name: 'Elder Mara', look: 1 + 1 + 8, dx: 0, dy: -4,
    title: { en: 'Elder Mara, the guide', fr: 'Ancienne Mara, la guide', es: 'Anciana Mara, la guía', ar: 'الحكيمة مارا، المرشدة' },
    idle: { en: 'Stay alive, child. Water, food, rest: never forget them.', fr: 'Reste en vie, petit. L\'eau, la nourriture, le repos : ne les oublie jamais.', es: 'Sigue con vida. Agua, comida, descanso: nunca los olvides.', ar: 'ابقَ حيًا يا بني. الماء والطعام والراحة: لا تنسها أبدًا.' } },
  { key: 'smith', name: 'Joren the smith', look: 1 + 3, dx: 6, dy: -2,
    title: { en: 'Joren, the smith', fr: 'Joren, le forgeron', es: 'Joren, el herrero', ar: 'جورن، الحداد' },
    idle: { en: 'Good tools make a long life. Come back when you need to learn.', fr: 'De bons outils font une longue vie. Reviens quand tu veux apprendre.', es: 'Buenas herramientas, larga vida. Vuelve cuando quieras aprender.', ar: 'الأدوات الجيدة تصنع حياة طويلة. عد عندما تريد أن تتعلم.' } },
  { key: 'hunter', name: 'Sela the hunter', look: 1 + 2 + 8, dx: -6, dy: -2,
    title: { en: 'Sela, the hunter', fr: 'Sela, la chasseuse', es: 'Sela, la cazadora', ar: 'سيلا، الصيادة' },
    idle: { en: 'The woods feed the patient and eat the careless.', fr: 'Les bois nourrissent les patients et dévorent les imprudents.', es: 'El bosque alimenta al paciente y devora al descuidado.', ar: 'الغابة تطعم الصبور وتأكل المتهور.' } },
  { key: 'warden', name: 'Warden Bram', look: 1 + 0, dx: 4, dy: 4,
    title: { en: 'Bram, the warden', fr: 'Bram, le gardien', es: 'Bram, el guardián', ar: 'برام، الحارس' },
    idle: { en: 'They come at nine at night. Be ready, keep a fire, stay together.', fr: 'Ils viennent à neuf heures du soir. Sois prêt, garde un feu, restez ensemble.', es: 'Vienen a las nueve de la noche. Prepárate, mantén un fuego, quedaos juntos.', ar: 'يأتون في التاسعة ليلًا. كن مستعدًا، أبقِ نارًا، وابقوا معًا.' } },
  { key: 'registrar', name: 'Odile the registrar', look: 1 + 4 + 8, dx: -4, dy: 4,
    title: { en: 'Odile, keeper of the clans', fr: 'Odile, gardienne des clans', es: 'Odile, guardiana de los clanes', ar: 'أوديل، حارسة العشائر' },
    idle: { en: 'Clans are founded here, in my book. Alone you survive; together you live.', fr: 'Les clans se fondent ici, dans mon livre. Seul on survit ; ensemble on vit.', es: 'Los clanes se fundan aquí, en mi libro. Solo sobrevives; juntos vivís.', ar: 'تُؤسَّس العشائر هنا في كتابي. وحدك تنجو، ومعًا تعيشون.' } },
  { key: 'mayor', name: 'Mayor Ines', look: 1 + 2 + 8, dx: 0, dy: -4, map: 'ridge',
    title: { en: 'Ines, mayor of Ridgeford', fr: 'Ines, maire de Ridgeford', es: 'Ines, alcaldesa de Ridgeford', ar: 'إيناس، عمدة ريدجفورد' },
    idle: { en: 'Ridgeford stands because we stand together. Five places, one people.', fr: 'Ridgeford tient debout parce que nous tenons ensemble. Cinq lieux, un seul peuple.', es: 'Ridgeford sigue en pie porque estamos unidos. Cinco lugares, un solo pueblo.', ar: 'ريدجفورد صامدة لأننا معًا. خمسة أماكن وشعب واحد.' } },
  { key: 'healer', name: 'Yasmin the healer', look: 1 + 3 + 8, dx: 6, dy: -2, map: 'ridge',
    title: { en: 'Yasmin, the healer', fr: 'Yasmin, la guérisseuse', es: 'Yasmin, la curandera', ar: 'ياسمين، المعالجة' },
    idle: { en: 'Herbs grow by the trees. A wound left alone becomes a grave.', fr: 'Les herbes poussent près des arbres. Une blessure négligée devient une tombe.', es: 'Las hierbas crecen junto a los árboles. Una herida descuidada se vuelve tumba.', ar: 'الأعشاب تنمو قرب الأشجار. الجرح المهمل يصير قبرًا.' } },
  { key: 'farmer', name: 'Old Tobias', look: 1 + 1, dx: -6, dy: -2, map: 'ridge',
    title: { en: 'Tobias, the old farmer', fr: 'Tobias, le vieux fermier', es: 'Tobias, el viejo granjero', ar: 'طوبياس، المزارع العجوز' },
    idle: { en: 'A field feeds you twice a day if you let it. Willow Farms still remembers how.', fr: 'Un champ te nourrit deux fois par jour si tu le laisses faire. Willow Farms s\'en souvient encore.', es: 'Un huerto te alimenta dos veces al día si lo dejas. Willow Farms aún lo recuerda.', ar: 'الحقل يطعمك مرتين في اليوم إن تركته. مزارع الصفصاف ما زالت تتذكر.' } },
  { key: 'ranger', name: 'Ranger Idris', look: 1 + 4, dx: 4, dy: 4, map: 'ridge',
    title: { en: 'Idris, the ranger', fr: 'Idris, le garde forestier', es: 'Idris, el guardabosques', ar: 'إدريس، حارس الغابة' },
    idle: { en: 'The forests are wide and hungry. Go by day, come back before dusk.', fr: 'Les forêts sont vastes et affamées. Pars de jour, reviens avant le soir.', es: 'Los bosques son grandes y hambrientos. Sal de día, vuelve antes del anochecer.', ar: 'الغابات واسعة وجائعة. اخرج نهارًا وعد قبل الغروب.' } },
  { key: 'builder', name: 'Nadia the builder', look: 1 + 0 + 8, dx: -4, dy: 4, map: 'ridge',
    title: { en: 'Nadia, the builder', fr: 'Nadia, la bâtisseuse', es: 'Nadia, la constructora', ar: 'نادية، البنّاءة' },
    idle: { en: 'Walls keep the night out. Every camp needs hands that build.', fr: 'Les murs gardent la nuit dehors. Chaque camp a besoin de mains qui bâtissent.', es: 'Los muros dejan fuera la noche. Todo campamento necesita manos que construyan.', ar: 'الجدران تبقي الليل خارجًا. كل مخيم يحتاج أيادي تبني.' } },
];
export const npcDef = (k: string): NpcDef | undefined => NPCS.find((n) => n.key === k);

/** What counts for a quest: a world event of this kind by the person (what = must appear in the event's `what` / `item`). */
export interface QuestNeed { ev: string; what?: string; n: number }
/** A step the AI people run for it (sim/tasks.ts skills). */
export interface QuestStep { do: string; what?: string; times?: number }

export interface QuestDef {
  id: string;
  npc: NpcKey;
  /** Any of these counts (n of the same one). */
  need: QuestNeed[];
  /** How AI people do it. */
  plan: QuestStep[];
  reward: { xp: number; items?: Record<string, number>; food?: number };
  title: L;
  /** The NPC gives the quest. */
  ask: L;
  /** The NPC when it is handed in. */
  done: L;
  /** What the person keeps knowing for good (English: it goes into the AI's prompts). */
  lesson: string;
}

export const QUESTS: QuestDef[] = [
  { id: 'q1', npc: 'guide', need: [{ ev: 'npc', what: 'warden', n: 1 }], plan: [{ do: 'npc', what: 'warden' }], reward: { xp: 20, food: 1 },
    title: { en: 'Know the town', fr: 'Connaître la ville', es: 'Conoce el pueblo', ar: 'تعرّف على البلدة' },
    ask: { en: 'Welcome, survivor. First, meet Warden Bram: he keeps us safe at night. Walk to him and talk, then come back to me.', fr: 'Bienvenue, survivant. D\'abord, va voir le gardien Bram : il nous protège la nuit. Parle-lui, puis reviens me voir.', es: 'Bienvenido, superviviente. Primero, ve a ver al guardián Bram: nos protege de noche. Habla con él y vuelve conmigo.', ar: 'مرحبًا أيها الناجي. أولًا، قابل الحارس برام: إنه يحمينا ليلًا. امشِ إليه وتحدث معه، ثم عد إليّ.' },
    done: { en: 'Good. Faces you know are faces that help you. Here, some food.', fr: 'Bien. Les visages que tu connais sont ceux qui t\'aident. Tiens, de quoi manger.', es: 'Bien. Las caras que conoces son las que te ayudan. Toma, algo de comida.', ar: 'جيد. الوجوه التي تعرفها هي التي تساعدك. خذ، بعض الطعام.' },
    lesson: 'The town has teachers: Elder Mara (guide), Joren (smith), Sela (hunter), Bram (warden), Odile (clans). Talk to them to learn.' },
  { id: 'q2', npc: 'guide', need: [{ ev: 'drink', n: 1 }], plan: [{ do: 'drink' }], reward: { xp: 20 },
    title: { en: 'Water first', fr: 'L\'eau d\'abord', es: 'Primero el agua', ar: 'الماء أولًا' },
    ask: { en: 'Thirst kills faster than anything. Go to the water and drink.', fr: 'La soif tue plus vite que tout. Va à l\'eau et bois.', es: 'La sed mata más rápido que nada. Ve al agua y bebe.', ar: 'العطش يقتل أسرع من أي شيء. اذهب إلى الماء واشرب.' },
    done: { en: 'Remember where the water is. Always.', fr: 'Souviens-toi où est l\'eau. Toujours.', es: 'Recuerda dónde está el agua. Siempre.', ar: 'تذكر أين الماء. دائمًا.' },
    lesson: 'Thirst kills fastest: drink before going far, and remember where the water is.' },
  { id: 'q3', npc: 'guide', need: [{ ev: 'pickup', n: 2 }], plan: [{ do: 'collect', what: 'food', times: 2 }], reward: { xp: 25, items: { wood: 1 } },
    title: { en: 'Something to eat', fr: 'De quoi manger', es: 'Algo que comer', ar: 'شيء للأكل' },
    ask: { en: 'Find food and pick up two pieces: berries, cans, whatever lies around. Keep some for later.', fr: 'Trouve de la nourriture et ramasses-en deux : baies, conserves, ce qui traîne. Garde-en pour plus tard.', es: 'Encuentra comida y recoge dos: bayas, latas, lo que haya. Guarda algo para luego.', ar: 'ابحث عن الطعام والتقط قطعتين: توت، معلبات، أي شيء ملقى. احتفظ ببعضه لوقت لاحق.' },
    done: { en: 'A full bag is a calm night. Well done.', fr: 'Un sac plein, c\'est une nuit calme. Bien joué.', es: 'Una bolsa llena es una noche tranquila. Bien hecho.', ar: 'حقيبة ممتلئة تعني ليلة هادئة. أحسنت.' },
    lesson: 'Carry food before you are hungry; picking it up early keeps you alive when hunger comes.' },
  { id: 'q4', npc: 'smith', need: [{ ev: 'gather', what: 'wood', n: 3 }], plan: [{ do: 'gather', what: 'wood', times: 3 }], reward: { xp: 25, items: { stone: 1 } },
    title: { en: 'Wood for everything', fr: 'Du bois pour tout', es: 'Madera para todo', ar: 'خشب لكل شيء' },
    ask: { en: 'Chop a tree three times and bring the wood. Wood makes fires, tools and homes.', fr: 'Coupe un arbre trois fois et garde le bois. Le bois fait les feux, les outils et les maisons.', es: 'Corta un árbol tres veces y guarda la madera. La madera hace fuegos, herramientas y casas.', ar: 'اقطع شجرة ثلاث مرات واحتفظ بالخشب. الخشب يصنع النار والأدوات والبيوت.' },
    done: { en: 'Strong arms. Here is a stone to go with it.', fr: 'De bons bras. Voici une pierre pour aller avec.', es: 'Buenos brazos. Toma una piedra para acompañarla.', ar: 'ذراعان قويتان. خذ حجرًا معه.' },
    lesson: 'Wood comes from chopping trees (an axe gives twice as much); it is needed for fires, tools, huts and walls.' },
  { id: 'q5', npc: 'smith', need: [{ ev: 'gather', what: 'stone', n: 2 }], plan: [{ do: 'gather', what: 'stone', times: 2 }], reward: { xp: 25 },
    title: { en: 'Stone from the ruins', fr: 'La pierre des ruines', es: 'Piedra de las ruinas', ar: 'حجر من الأطلال' },
    ask: { en: 'Search the rubble or break a rock: get two stones. Stone is rarer than wood, look well.', fr: 'Fouille les gravats ou casse un rocher : trouve deux pierres. La pierre est plus rare que le bois.', es: 'Busca en los escombros o rompe una roca: consigue dos piedras. La piedra es más rara que la madera.', ar: 'ابحث في الركام أو اكسر صخرة: احصل على حجرين. الحجر أندر من الخشب.' },
    done: { en: 'Now you can make a real tool.', fr: 'Maintenant tu peux faire un vrai outil.', es: 'Ahora puedes hacer una herramienta de verdad.', ar: 'الآن يمكنك صنع أداة حقيقية.' },
    lesson: 'Stone comes from rubble and rocks; it is rarer than wood, so keep it for tools, fires and huts.' },
  { id: 'q6', npc: 'smith', need: [{ ev: 'craft', what: 'axe', n: 1 }], plan: [{ do: 'craft', what: 'axe' }], reward: { xp: 35, items: { wood: 2 } },
    title: { en: 'Your first axe', fr: 'Ta première hache', es: 'Tu primera hacha', ar: 'فأسك الأول' },
    ask: { en: 'Two wood and one stone make an axe (Bag > Craft > Weapons). Make one: it chops twice as fast and it is a weapon too.', fr: 'Deux bois et une pierre font une hache (Sac > Fabriquer > Armes). Fais-en une : elle coupe deux fois plus et c\'est une arme.', es: 'Dos maderas y una piedra hacen un hacha (Bolsa > Fabricar > Armas). Haz una: corta el doble y también es un arma.', ar: 'خشبتان وحجر يصنعون فأسًا (الحقيبة > صنع > أسلحة). اصنع واحدة: تقطع بضعف السرعة وهي سلاح أيضًا.' },
    done: { en: 'A fine axe. Take care of it and it takes care of you.', fr: 'Une belle hache. Prends-en soin et elle prendra soin de toi.', es: 'Un buen hacha. Cuídala y ella te cuidará.', ar: 'فأس جيدة. اعتنِ بها وستعتني بك.' },
    lesson: 'Craft an axe early (2 wood + 1 stone): double wood from every tree, and it is a weapon against zombies.' },
  { id: 'q7', npc: 'warden', need: [{ ev: 'build', what: 'campfire', n: 1 }, { ev: 'tend', n: 1 }], plan: [{ do: 'build', what: 'campfire' }], reward: { xp: 35, food: 1 },
    title: { en: 'Fire at night', fr: 'Du feu la nuit', es: 'Fuego de noche', ar: 'نار في الليل' },
    ask: { en: 'Zombies and wolves fear the fire. Build a campfire (3 wood, 2 stone) or put wood on the camp\'s fire.', fr: 'Zombies et loups craignent le feu. Construis un feu de camp (3 bois, 2 pierres) ou remets du bois sur celui du camp.', es: 'Zombis y lobos temen al fuego. Construye una fogata (3 maderas, 2 piedras) o echa leña a la del campamento.', ar: 'الزومبي والذئاب تخاف النار. ابنِ نار مخيم (3 خشب، 2 حجر) أو ضع حطبًا على نار المخيم.' },
    done: { en: 'Keep it burning through the night and sleep close to it.', fr: 'Garde-le allumé toute la nuit et dors près de lui.', es: 'Mantenlo encendido toda la noche y duerme cerca.', ar: 'أبقها مشتعلة طوال الليل ونم بقربها.' },
    lesson: 'A fire keeps animals and zombies off and makes sleep restful: build one at dusk, feed it wood, sleep near it.' },
  { id: 'q8', npc: 'warden', need: [{ ev: 'craft', what: 'spear', n: 1 }, { ev: 'craft', what: 'sword', n: 1 }, { ev: 'craft', what: 'bow', n: 1 }], plan: [{ do: 'craft', what: 'spear' }], reward: { xp: 40, items: { clothes: 1 } },
    title: { en: 'Fight back', fr: 'Riposter', es: 'Defiéndete', ar: 'دافع عن نفسك' },
    ask: { en: 'Running is not always enough. Craft a weapon: a spear (2 wood, 1 scrap), a sword or a bow. Then you fight back.', fr: 'Fuir ne suffit pas toujours. Fabrique une arme : une lance (2 bois, 1 ferraille), une épée ou un arc.', es: 'Huir no siempre basta. Fabrica un arma: una lanza (2 maderas, 1 chatarra), una espada o un arco.', ar: 'الهرب لا يكفي دائمًا. اصنع سلاحًا: رمح (2 خشب، 1 خردة)، سيف أو قوس. ثم دافع.' },
    done: { en: 'Now when they come, you stand. Take these clothes: they soften the bites.', fr: 'Maintenant, quand ils viennent, tu tiens. Prends ces vêtements : ils adoucissent les morsures.', es: 'Ahora, cuando vengan, resistirás. Toma esta ropa: suaviza los mordiscos.', ar: 'الآن عندما يأتون ستصمد. خذ هذه الملابس: تخفف العضّات.' },
    lesson: 'Carry a weapon (spear, sword, axe or bow) and fight back when a zombie or an animal attacks; together and armed you win, alone and unarmed run to the fire.' },
  { id: 'q9', npc: 'hunter', need: [{ ev: 'hunt', n: 1 }], plan: [{ do: 'hunt', what: 'rabbit' }], reward: { xp: 40, items: { arrows: 5 } },
    title: { en: 'The first hunt', fr: 'La première chasse', es: 'La primera caza', ar: 'الصيد الأول' },
    ask: { en: 'Meat, leather, claws: the animals give everything. Hunt one, a rabbit is enough. Careful with boars and bears.', fr: 'Viande, cuir, griffes : les animaux donnent tout. Chasses-en un, un lapin suffit. Attention aux sangliers et aux ours.', es: 'Carne, cuero, garras: los animales lo dan todo. Caza uno, un conejo basta. Cuidado con jabalíes y osos.', ar: 'اللحم والجلد والمخالب: الحيوانات تعطي كل شيء. اصطد واحدًا، الأرنب يكفي. احذر الخنازير البرية والدببة.' },
    done: { en: 'You have the eye. Here, arrows for when you make a bow.', fr: 'Tu as l\'œil. Tiens, des flèches pour quand tu auras un arc.', es: 'Tienes buen ojo. Toma flechas para cuando tengas un arco.', ar: 'لديك عين الصياد. خذ سهامًا لعندما تصنع قوسًا.' },
    lesson: 'Hunting gives meat, leather (clothes, bows) and claws; rabbits and deer are safe, boars and bears fight back, wolves bite at night.' },
  { id: 'q10', npc: 'registrar', need: [{ ev: 'clanJoin', n: 1 }], plan: [{ do: 'clan', what: 'join' }], reward: { xp: 50, food: 2 },
    title: { en: 'Never alone', fr: 'Jamais seul', es: 'Nunca solo', ar: 'لست وحدك أبدًا' },
    ask: { en: 'A clan shares food, guards at night and votes for its leader. Join one (Game menu > Clan), or found your own here with me.', fr: 'Un clan partage la nourriture, monte la garde et élit son chef. Rejoins-en un (Menu > Clan) ou fonde le tien ici avec moi.', es: 'Un clan comparte comida, hace guardia y vota a su líder. Únete a uno (Menú > Clan) o funda el tuyo aquí conmigo.', ar: 'العشيرة تتقاسم الطعام وتحرس ليلًا وتنتخب قائدها. انضم إلى واحدة (القائمة > العشيرة) أو أسس عشيرتك هنا معي.' },
    done: { en: 'Your name is in my book now. Stand by your clan and it will stand by you.', fr: 'Ton nom est dans mon livre. Soutiens ton clan et il te soutiendra.', es: 'Tu nombre está en mi libro. Apoya a tu clan y él te apoyará.', ar: 'اسمك في كتابي الآن. قف مع عشيرتك وستقف معك.' },
    lesson: 'A clan is safety: members share work, guard each other and vote for their leader; you may change clan if another suits you better.' },
  // ---- Ridgeford (imad 2026-11-27: "more quests, they require the NPCs, another 10 in the new town"). They open after q10.
  { id: 'q11', npc: 'guide', need: [{ ev: 'npc', what: 'mayor', n: 1 }], plan: [{ do: 'npc', what: 'mayor' }], reward: { xp: 45, food: 1 },
    title: { en: 'The road north', fr: 'La route du nord', es: 'El camino del norte', ar: 'طريق الشمال' },
    ask: { en: 'You are ready for more than our town. Take the north road to Ridgeford and speak with Mayor Ines. Go by day.', fr: 'Tu es prêt pour plus que notre ville. Prends la route du nord jusqu\'à Ridgeford et parle à la maire Ines. Pars de jour.', es: 'Estás listo para algo más que nuestro pueblo. Toma el camino del norte hasta Ridgeford y habla con la alcaldesa Ines. Ve de día.', ar: 'أنت مستعد لأكثر من بلدتنا. خذ الطريق الشمالي إلى ريدجفورد وتحدث مع العمدة إيناس. اذهب نهارًا.' },
    done: { en: 'Ines wrote to me: you made it. The world is bigger than one town.', fr: 'Ines m\'a écrit : tu es arrivé. Le monde est plus grand qu\'une ville.', es: 'Ines me escribió: llegaste. El mundo es más grande que un pueblo.', ar: 'كتبت لي إيناس: لقد وصلت. العالم أكبر من بلدة واحدة.' },
    lesson: 'There are five places: Old Town in the middle; Ridgeford (a second town) north, Willow Farms (fields, a quarry, wild horses) west, Pine Woods east and Black Fir Forest south (both wild and dangerous). Ridgeford has its own teachers.' },
  { id: 'q12', npc: 'mayor', need: [{ ev: 'gather', what: 'water', n: 2 }], plan: [{ do: 'gather', what: 'water', times: 2 }], reward: { xp: 35, items: { wood: 2 } },
    title: { en: 'Water for the road', fr: 'De l\'eau pour la route', es: 'Agua para el camino', ar: 'ماء للطريق' },
    ask: { en: 'Nobody crosses the roads thirsty. Fill bottles at the water twice: then you can drink anywhere.', fr: 'Personne ne prend la route assoiffé. Remplis des bouteilles à l\'eau deux fois : tu pourras boire n\'importe où.', es: 'Nadie cruza los caminos con sed. Llena botellas en el agua dos veces: así podrás beber en cualquier sitio.', ar: 'لا أحد يسافر عطشانًا. املأ القوارير من الماء مرتين: عندها تشرب في أي مكان.' },
    done: { en: 'Bottles in the bag, the road is shorter. Yasmin wants to see you.', fr: 'Des bouteilles dans le sac, la route est plus courte. Yasmin veut te voir.', es: 'Con botellas en la bolsa, el camino es más corto. Yasmin quiere verte.', ar: 'بالقوارير في الحقيبة يقصر الطريق. ياسمين تريد رؤيتك.' },
    lesson: 'Fill water bottles before a long walk: you can drink them anywhere, far from any water.' },
  { id: 'q13', npc: 'healer', need: [{ ev: 'gather', what: 'herb', n: 3 }], plan: [{ do: 'gather', what: 'herb', times: 3 }], reward: { xp: 35 },
    title: { en: 'Healing herbs', fr: 'Herbes qui soignent', es: 'Hierbas que curan', ar: 'أعشاب شافية' },
    ask: { en: 'Herbs grow in small leafy clumps next to trees. Pick three patches and keep them.', fr: 'Les herbes poussent en petites touffes près des arbres. Cueilles-en trois et garde-les.', es: 'Las hierbas crecen en matas junto a los árboles. Recoge tres y guárdalas.', ar: 'الأعشاب تنمو في خصلات صغيرة قرب الأشجار. اقطف ثلاثًا واحتفظ بها.' },
    done: { en: 'Good eyes. Now let me show you what they are for.', fr: 'Bons yeux. Maintenant je te montre à quoi elles servent.', es: 'Buen ojo. Ahora te enseño para qué sirven.', ar: 'عينان جيدتان. الآن سأريك فيمَ تُستعمل.' },
    lesson: 'Healing herbs grow next to trees (more in the woods and on the farms); pick them before you are hurt.' },
  { id: 'q14', npc: 'healer', need: [{ ev: 'craft', what: 'medkit', n: 1 }], plan: [{ do: 'craft', what: 'medkit' }], reward: { xp: 50, items: { herb: 2 } },
    title: { en: 'A first-aid kit', fr: 'Une trousse de secours', es: 'Un botiquín', ar: 'حقيبة إسعاف' },
    ask: { en: 'Three herbs and one leather make a first-aid kit (Bag > Craft > Healing). Make one and carry it always.', fr: 'Trois herbes et un cuir font une trousse (Sac > Fabriquer > Soins). Fais-en une et garde-la toujours.', es: 'Tres hierbas y un cuero hacen un botiquín (Bolsa > Fabricar > Curación). Haz uno y llévalo siempre.', ar: 'ثلاث أعشاب وجلدة واحدة تصنع حقيبة إسعاف (الحقيبة > صنع > علاج). اصنع واحدة واحملها دائمًا.' },
    done: { en: 'That kit is a life, maybe yours. Use it when your health is low.', fr: 'Cette trousse est une vie, peut-être la tienne. Utilise-la quand ta santé baisse.', es: 'Ese botiquín es una vida, quizá la tuya. Úsalo cuando tu salud baje.', ar: 'تلك الحقيبة حياة، ربما حياتك. استعملها حين تنخفض صحتك.' },
    lesson: 'A first-aid kit (3 herbs + 1 leather) heals 45 health at once: carry one, use it when hurt, and treat others who are bleeding.' },
  { id: 'q15', npc: 'farmer', need: [{ ev: 'build', what: 'field', n: 1 }], plan: [{ do: 'farm' }], reward: { xp: 40, food: 2 },
    title: { en: 'Plant a field', fr: 'Planter un champ', es: 'Planta un huerto', ar: 'ازرع حقلًا' },
    ask: { en: 'Hunting feeds you today, a field feeds you every day. Plant one near your camp.', fr: 'La chasse te nourrit aujourd\'hui, un champ tous les jours. Plante-en un près de ton camp.', es: 'La caza te alimenta hoy, un huerto todos los días. Planta uno cerca de tu campamento.', ar: 'الصيد يطعمك اليوم، والحقل يطعمك كل يوم. ازرع واحدًا قرب مخيمك.' },
    done: { en: 'Berries every twelve hours. Patience is food too.', fr: 'Des baies toutes les douze heures. La patience aussi, ça nourrit.', es: 'Bayas cada doce horas. La paciencia también alimenta.', ar: 'توت كل اثنتي عشرة ساعة. الصبر طعام أيضًا.' },
    lesson: 'A field near the camp gives berries every 12 hours forever; the old fields of Willow Farms still bear too.' },
  { id: 'q16', npc: 'farmer', need: [{ ev: 'store', n: 3 }], plan: [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }], reward: { xp: 40, items: { wood: 2, stone: 1 } },
    title: { en: 'Fill the store', fr: 'Remplir la réserve', es: 'Llena el almacén', ar: 'املأ المخزن' },
    ask: { en: 'Put things away in the camp\'s store three times: food, wood, water. A full store saves a winter.', fr: 'Range trois fois des choses dans la réserve du camp : nourriture, bois, eau. Une réserve pleine sauve un hiver.', es: 'Guarda cosas en el almacén del campamento tres veces: comida, madera, agua. Un almacén lleno salva un invierno.', ar: 'ضع أشياء في مخزن المخيم ثلاث مرات: طعام، خشب، ماء. المخزن الممتلئ ينقذ شتاءً.' },
    done: { en: 'What is shared is not lost. The others will eat because of you.', fr: 'Ce qui est partagé n\'est pas perdu. Les autres mangeront grâce à toi.', es: 'Lo compartido no se pierde. Los demás comerán gracias a ti.', ar: 'ما يُتقاسم لا يضيع. سيأكل الآخرون بفضلك.' },
    lesson: 'Store spare food, water and wood in the camp store: in the cold, at night or when hurt, everyone eats from it.' },
  { id: 'q17', npc: 'builder', need: [{ ev: 'build', what: 'palisade', n: 1 }, { ev: 'build', what: 'spikes', n: 1 }, { ev: 'build', what: 'stonewall', n: 1 }, { ev: 'build', what: 'bed', n: 1 }], plan: [{ do: 'build', what: 'palisade' }], reward: { xp: 50, items: { wood: 4 } },
    title: { en: 'Build to last', fr: 'Bâtir pour durer', es: 'Construye para durar', ar: 'ابنِ ليدوم' },
    ask: { en: 'Build something that protects or shelters: a palisade, spikes, a stone wall, or a bed in your home.', fr: 'Construis quelque chose qui protège ou abrite : une palissade, des pieux, un mur de pierre ou un lit chez toi.', es: 'Construye algo que proteja o dé cobijo: una empalizada, estacas, un muro de piedra o una cama en tu casa.', ar: 'ابنِ شيئًا يحمي أو يؤوي: سياجًا، أوتادًا، جدارًا حجريًا، أو سريرًا في بيتك.' },
    done: { en: 'Good work. A wall built today is a life saved tonight. Take some wood for the next one.', fr: 'Beau travail. Un mur bâti aujourd\'hui, c\'est une vie sauvée ce soir. Prends du bois pour le suivant.', es: 'Buen trabajo. Un muro hecho hoy es una vida salvada esta noche. Toma madera para el siguiente.', ar: 'عمل جيد. جدار يُبنى اليوم حياة تُنقذ الليلة. خذ خشبًا للتالي.' },
    lesson: 'Defences (palisade, spikes, stone walls) keep zombies and beasts out of the camp; beds make sleep at home restful. Build them before you need them.' },
  { id: 'q18', npc: 'ranger', need: [{ ev: 'explore', n: 1 }], plan: [{ do: 'explore', what: 'woods', times: 2 }], reward: { xp: 55, items: { arrows: 5 } },
    title: { en: 'Beyond the trees', fr: 'Au-delà des arbres', es: 'Más allá de los árboles', ar: 'ما وراء الأشجار' },
    ask: { en: 'Go and look at places few have seen, by day, and come back to tell. Knowing the land keeps people alive.', fr: 'Va voir des endroits que peu ont vus, de jour, et reviens raconter. Connaître le pays garde les gens en vie.', es: 'Ve a ver lugares que pocos han visto, de día, y vuelve a contarlo. Conocer la tierra mantiene viva a la gente.', ar: 'اذهب وانظر أماكن قلّ من رآها، نهارًا، وعد لتحكي. معرفة الأرض تبقي الناس أحياء.' },
    done: { en: 'Tell the others what you saw: water, game, danger. That is how we all learn.', fr: 'Raconte aux autres ce que tu as vu : eau, gibier, danger. C\'est comme ça qu\'on apprend tous.', es: 'Cuenta a los demás lo que viste: agua, caza, peligro. Así aprendemos todos.', ar: 'أخبر الآخرين بما رأيت: ماء، صيد، خطر. هكذا نتعلم جميعًا.' },
    lesson: 'Explore by day and come home before dusk; tell others where the water, game, herbs and dangers are.' },
  { id: 'q19', npc: 'ranger', need: [{ ev: 'tamed', n: 1 }], plan: [{ do: 'tame' }, { do: 'ride', what: 'home' }], reward: { xp: 70, food: 2 },
    title: { en: 'A horse of your own', fr: 'Un cheval à toi', es: 'Un caballo propio', ar: 'حصان خاص بك' },
    ask: { en: 'Wild horses graze in Willow Farms and the forests. Walk up calmly and tame one: the roads become short.', fr: 'Des chevaux sauvages paissent à Willow Farms et dans les forêts. Approche calmement et apprivoises-en un : les routes deviennent courtes.', es: 'Caballos salvajes pastan en Willow Farms y en los bosques. Acércate con calma y doma uno: los caminos se acortan.', ar: 'خيول برية ترعى في مزارع الصفصاف والغابات. اقترب بهدوء وروّض واحدًا: تقصر الطرق.' },
    done: { en: 'Treat it well and it will carry you out of any danger.', fr: 'Traite-le bien et il te sortira de tous les dangers.', es: 'Trátalo bien y te sacará de cualquier peligro.', ar: 'عامله جيدًا وسيخرجك من أي خطر.' },
    lesson: 'Wild horses live in Willow Farms and the forests; walk (never run) up to one to tame it, whistle for it, ride far and flee fast.' },
  { id: 'q20', npc: 'mayor', need: [{ ev: 'gather', what: 'ore', n: 2 }], plan: [{ do: 'gather', what: 'ore', times: 2 }], reward: { xp: 80, items: { scrap: 2, leather: 1 } },
    title: { en: 'Ore for steel', fr: 'Du minerai pour l\'acier', es: 'Mineral para el acero', ar: 'خام للفولاذ' },
    ask: { en: 'Swords, armour and good tools need ore. Break rocks until you find two: the old quarry at Willow Farms has the most.', fr: 'Épées, armures et bons outils demandent du minerai. Casse des rochers jusqu\'à en trouver deux : la vieille carrière de Willow Farms en a le plus.', es: 'Espadas, armaduras y buenas herramientas necesitan mineral. Rompe rocas hasta encontrar dos: la vieja cantera de Willow Farms tiene más.', ar: 'السيوف والدروع والأدوات الجيدة تحتاج خامًا. اكسر الصخور حتى تجد قطعتين: المحجر القديم في مزارع الصفصاف فيه الأكثر.' },
    done: { en: 'You know the land, its people and its riches now. Ridgeford is your home as much as any place.', fr: 'Tu connais maintenant le pays, ses gens et ses richesses. Ridgeford est ta maison autant qu\'ailleurs.', es: 'Ahora conoces la tierra, su gente y sus riquezas. Ridgeford es tu hogar tanto como cualquier sitio.', ar: 'أنت تعرف الآن الأرض وأهلها وخيراتها. ريدجفورد بيتك كأي مكان آخر.' },
    lesson: 'Ore is rare (1 blow in 10 on a rock); the quarry at Willow Farms has the most rocks. Ore makes swords, armour and better gear.' },
];
export const questDef = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);

/** The player's view of their quests (Do 'quests'). */
export interface QuestRow { id: string; state: 'done' | 'active' | 'ready' | 'next' | 'locked'; n: number; need: number }
