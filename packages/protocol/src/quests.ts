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

export const NPC_KEYS = ['guide', 'smith', 'hunter', 'warden', 'registrar'] as const;
export type NpcKey = (typeof NPC_KEYS)[number];

export interface NpcDef {
  key: NpcKey;
  name: string;
  /** Look as for players' characters: 1 + skin tone 0-4, + 8 for a woman. */
  look: number;
  /** Where they stand: offset in metres from the middle of the start map. */
  dx: number; dy: number;
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
];
export const questDef = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);

/** The player's view of their quests (Do 'quests'). */
export interface QuestRow { id: string; state: 'done' | 'active' | 'ready' | 'next' | 'locked'; n: number; need: number }
