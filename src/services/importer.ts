import {
  Build,
  BuildSourceType,
  BuildStage,
  ChecklistItem,
  GearPriority,
  GemSetup,
  LabStep,
  PassiveMilestone,
  UserProgress,
} from "@/domain/models";

type Archetype = "caster" | "bow" | "melee" | "minion" | "totem";

interface ArchetypeProfile {
  label: string;
  classFallback: string;
  ascendancyFallback: string;
  levelingSkill: string;
  transitionSkill: string;
  endgameSkill: string;
  supportSet: string[];
  auraSet: string[];
  utilitySet: string[];
  movementSkill: string;
  weaponFocus: string;
  defensiveFocus: string;
  uniqueHint: string;
  playstyle: string;
  nextUpgrade: string;
}

const classKeywords = [
  { pattern: /witch/i, className: "Witch" },
  { pattern: /templar/i, className: "Templar" },
  { pattern: /shadow/i, className: "Shadow" },
  { pattern: /ranger/i, className: "Ranger" },
  { pattern: /duelist/i, className: "Duelist" },
  { pattern: /marauder/i, className: "Marauder" },
  { pattern: /scion/i, className: "Scion" },
];

const ascendancyKeywords = [
  "Elementalist",
  "Necromancer",
  "Deadeye",
  "Champion",
  "Chieftain",
  "Inquisitor",
  "Hierophant",
  "Trickster",
  "Slayer",
  "Juggernaut",
  "Ascendant",
];

const archetypeProfiles: Record<Archetype, ArchetypeProfile> = {
  caster: {
    label: "Caster",
    classFallback: "Witch",
    ascendancyFallback: "Elementalist",
    levelingSkill: "Rolling Magma",
    transitionSkill: "Spark",
    endgameSkill: "Spark",
    supportSet: ["Added Lightning Damage", "Pierce", "Controlled Destruction"],
    auraSet: ["Clarity", "Herald of Thunder", "Determination"],
    utilitySet: ["Flame Wall", "Wave of Conviction", "Arcanist Brand"],
    movementSkill: "Flame Dash",
    weaponFocus: "wand ou sceptre com +spell damage",
    defensiveFocus: "capar resist e manter life em todos os slots",
    uniqueHint: "Lifesprig ou Axiom Perpetuum",
    playstyle: "limpar telas rápido e kitear bosses com cast curto",
    nextUpgrade: "fechar um 4-link cedo e reservar aura defensiva sem travar mana",
  },
  bow: {
    label: "Bow",
    classFallback: "Ranger",
    ascendancyFallback: "Deadeye",
    levelingSkill: "Caustic Arrow",
    transitionSkill: "Lightning Arrow",
    endgameSkill: "Lightning Arrow",
    supportSet: ["Mirage Archer", "Added Cold Damage", "Elemental Damage with Attacks"],
    auraSet: ["Precision", "Grace", "Herald of Ice"],
    utilitySet: ["Sniper's Mark", "Artillery Ballista", "Blood Rage"],
    movementSkill: "Dash",
    weaponFocus: "arco com elemental DPS e attack speed",
    defensiveFocus: "evasion, spell suppression e resist",
    uniqueHint: "Quill Rain ou Roth's Reach",
    playstyle: "andar agressivo, limpar packs em cone e reposicionar sempre",
    nextUpgrade: "trocar arco a cada breakpoint de campanha e garantir quiver com vida",
  },
  melee: {
    label: "Melee",
    classFallback: "Duelist",
    ascendancyFallback: "Champion",
    levelingSkill: "Splitting Steel",
    transitionSkill: "Boneshatter",
    endgameSkill: "Boneshatter",
    supportSet: ["Melee Physical Damage", "Ruthless", "Brutality"],
    auraSet: ["Precision", "Determination", "War Banner"],
    utilitySet: ["Ancestral Protector", "Molten Shell", "Enduring Cry"],
    movementSkill: "Leap Slam",
    weaponFocus: "arma rara com alto DPS físico",
    defensiveFocus: "armour, life e resistência ao stun",
    uniqueHint: "Limbsplit ou The Cauteriser",
    playstyle: "encostar, manter uptime de totem e ganhar mapa no ritmo do leap slam",
    nextUpgrade: "subir o DPS da arma em toda faixa de ato e manter armour consistente",
  },
  minion: {
    label: "Minion",
    classFallback: "Witch",
    ascendancyFallback: "Necromancer",
    levelingSkill: "Summon Raging Spirit",
    transitionSkill: "Absolution",
    endgameSkill: "Absolution",
    supportSet: ["Minion Damage", "Unleash", "Spell Echo"],
    auraSet: ["Clarity", "Determination", "Tempest Shield"],
    utilitySet: ["Desecrate", "Bone Offering", "Convocation"],
    movementSkill: "Flame Dash",
    weaponFocus: "wand com +minion gems ou cast speed",
    defensiveFocus: "block, life e resist",
    uniqueHint: "Sidhebreath ou Reverberation Rod",
    playstyle: "invocar a rotação, reposicionar minions e pilotar em segurança",
    nextUpgrade: "garantir links para minions e trigger simples para offering",
  },
  totem: {
    label: "Totem",
    classFallback: "Templar",
    ascendancyFallback: "Hierophant",
    levelingSkill: "Holy Flame Totem",
    transitionSkill: "Freezing Pulse Totem",
    endgameSkill: "Freezing Pulse Totem",
    supportSet: ["Multiple Totems", "Controlled Destruction", "Added Cold Damage"],
    auraSet: ["Clarity", "Determination", "Zealotry"],
    utilitySet: ["Frostbite", "Arcane Surge", "Sigil of Power"],
    movementSkill: "Flame Dash",
    weaponFocus: "wand ou sceptre com +gem level",
    defensiveFocus: "mana sustain, life e resist",
    uniqueHint: "Kikazaru ou Soul Mantle depois",
    playstyle: "plantar totems, recuar e usar tempo morto para progressão segura",
    nextUpgrade: "abrir +1 gem levels e aumentar número de links antes de maps",
  },
};

function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractName(sourceType: BuildSourceType, sourceValue: string) {
  const explicitMatch =
    sourceValue.match(/(?:name|build)\s*[:=-]\s*(.+)/i) ??
    sourceValue.match(/^(.{3,80})$/m);

  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  if (sourceType === "link") {
    try {
      const url = new URL(sourceValue.trim());
      const slug = url.pathname.split("/").filter(Boolean).at(-1);
      if (slug) {
        return toTitleCase(decodeURIComponent(slug));
      }
    } catch {
      return "Imported PoB Build";
    }
  }

  return "Imported PoB Build";
}

function extractClassName(sourceValue: string, fallback: string) {
  return classKeywords.find((entry) => entry.pattern.test(sourceValue))?.className ?? fallback;
}

function extractAscendancy(sourceValue: string, fallback: string) {
  return (
    ascendancyKeywords.find((entry) => new RegExp(entry, "i").test(sourceValue)) ?? fallback
  );
}

function inferArchetype(sourceValue: string): Archetype {
  const source = sourceValue.toLowerCase();

  if (source.includes("minion") || source.includes("absolution") || source.includes("srs")) {
    return "minion";
  }

  if (source.includes("totem") || source.includes("ballista")) {
    return "totem";
  }

  if (
    source.includes("bow") ||
    source.includes("lightning arrow") ||
    source.includes("ice shot")
  ) {
    return "bow";
  }

  if (
    source.includes("melee") ||
    source.includes("boneshatter") ||
    source.includes("slam") ||
    source.includes("strike")
  ) {
    return "melee";
  }

  return "caster";
}

function extractNotes(sourceValue: string) {
  const noteLines = sourceValue
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^note[:=-]/i.test(line))
    .map((line) => line.replace(/^note[:=-]\s*/i, ""));

  if (noteLines.length > 0) {
    return noteLines.join("\n");
  }

  return "Importado para um roadmap jogável. Ajuste gems e checkpoints conforme a versão real do PoB.";
}

function stagePassive(stageId: string, index: number, targetName: string, pointsRequired: number, instructions: string): PassiveMilestone {
  return {
    id: `${stageId}-passive-${index}`,
    targetName,
    pointsRequired,
    instructions,
  };
}

function stageGem(
  stageId: string,
  index: number,
  category: GemSetup["category"],
  mainGem: string,
  supportGems: string[],
  optionalGems: string[],
  notes: string,
): GemSetup {
  return {
    id: `${stageId}-gem-${index}`,
    stageId,
    category,
    mainGem,
    supportGems,
    optionalGems,
    notes,
  };
}

function stageGear(
  stageId: string,
  index: number,
  slot: string,
  requiredStats: string[],
  preferredStats: string[],
  uniqueSuggestion: string | undefined,
  notes: string,
): GearPriority {
  return {
    id: `${stageId}-gear-${index}`,
    slot,
    requiredStats,
    preferredStats,
    uniqueSuggestion,
    notes,
  };
}

function stageChecklist(
  stageId: string,
  index: number,
  text: string,
  type: ChecklistItem["type"],
  required = true,
): ChecklistItem {
  return {
    id: `${stageId}-check-${index}`,
    text,
    type,
    required,
  };
}

type PassiveDraft = [string, number, string];
type GemDraft = [GemSetup["category"], string, string[], string[], string];
type GearDraft = [string, string[], string[], string | undefined, string];
type ChecklistDraft = [string, ChecklistItem["type"], boolean];

interface StageDraft {
  label: string;
  levelMin: number;
  levelMax: number;
  title: string;
  summary: string;
  passives: PassiveDraft[];
  gems: GemDraft[];
  gear: GearDraft[];
  checklist: ChecklistDraft[];
  notes: string[];
}

function createStages(buildId: string, profile: ArchetypeProfile): BuildStage[] {
  const stages: StageDraft[] = [
    {
      label: "Stage 01",
      levelMin: 1,
      levelMax: 28,
      title: "Campanha inicial",
      summary: `Liga a build com ${profile.levelingSkill}, fecha links cedo e organiza o primeiro pico de dano sem travar sustain.`,
      passives: [
        ["Primeiro wheel de vida", 8, "Fechar vida básica antes de alongar rota ofensiva."],
        ["Cluster principal de dano", 14, `Priorizar o cluster que escala ${profile.levelingSkill}.`],
      ],
      gems: [
        ["main", profile.levelingSkill, profile.supportSet.slice(0, 2), [profile.supportSet[2]], "Usar 3-link cedo e manter upgrade de gem ativo."],
        ["movement", profile.movementSkill, ["Second Wind"], [], "Mobilidade é parte do pacing do leveling."],
      ],
      gear: [
        ["weapon", [profile.weaponFocus], ["cast/attack speed", "life on hit ou mana sustain"], profile.uniqueHint, "Trocar a arma assim que o dano cair em boss de ato."],
        ["armour", [profile.defensiveFocus], ["movement speed", "attributes"], undefined, "Boots com movespeed cedo têm prioridade real de UX."],
      ],
      checklist: [
        ["Fechar 3-link principal antes do Ato 3", "gem", true],
        ["Subir resistências para a próxima faixa de zona", "gear", true],
        ["Reservar aura base sem quebrar sustain", "quest", true],
      ],
      notes: [
        "Foco em baixa fricção: matar pack, andar, trocar frasco só quando necessário.",
        "Se o dano cair, a primeira suspeita é arma ou link, não árvore.",
      ],
    },
    {
      label: "Stage 02",
      levelMin: 28,
      levelMax: 55,
      title: "Primeira transição",
      summary: `Troca para ${profile.transitionSkill}, estabiliza 4-link e prepara o primeiro lab sem perder o ritmo da campanha.`,
      passives: [
        ["Mastery de reserva ou sustain", 24, "Abrir eficiência de mana para suportar setup mais completo."],
        ["Bloco defensivo principal", 32, `Buscar ${profile.defensiveFocus} como baseline antes do Ato 6.`],
      ],
      gems: [
        ["main", profile.transitionSkill, profile.supportSet, [profile.endgameSkill], "Esse é o setup de meio de campanha que precisa aguentar bosses longos."],
        ["utility", profile.utilitySet[0], profile.utilitySet.slice(1), [profile.auraSet[1]], "Manter debuff ou setup auxiliar sempre acessível."],
      ],
      gear: [
        ["gloves", ["life", "resist"], ["attack/cast speed", "suppression"], undefined, "Luvas resolvem vários buracos de gearing nessa fase."],
        ["rings", ["mana sustain", "resist"], ["attributes", "life"], undefined, "Anéis seguram transição de gems e auras."],
      ],
      checklist: [
        ["Completar o primeiro lab assim que a build estiver estável", "lab", true],
        ["Garantir 4-link principal", "gem", true],
        ["Atualizar flask setup para campanha média", "gear", false],
      ],
      notes: [
        "Toda transição precisa vir com um plano de mana ou reserva.",
        "Se faltarem atributos, resolver em gear evita desvio ruim de árvore.",
      ],
    },
    {
      label: "Stage 03",
      levelMin: 55,
      levelMax: 75,
      title: "On-ramp para maps",
      summary: `Consolidar o setup alvo, entrar em mapas com resistência capada e deixar a build pronta para lab seguinte.`,
      passives: [
        ["Wheel ofensivo secundário", 42, "Completar o segundo cluster que define clear speed."],
        ["Defesa para mapas amarelos", 52, "Subir vida efetiva antes de greed por dano marginal."],
      ],
      gems: [
        ["main", profile.endgameSkill, profile.supportSet, [profile.auraSet[2]], "Map entry pede setup que não dependa de micro extra."],
        ["aura", profile.auraSet[1], [profile.auraSet[2]], [profile.auraSet[0]], "Fechar camada defensiva e depois eficiência."],
      ],
      gear: [
        ["body armour", ["4-link ou 5-link"], ["life", "armour/evasion"], undefined, "Essa troca define conforto real nos primeiros mapas."],
        ["belt", ["life", "resist"], ["flask modifiers"], undefined, "Cinto é a peça mais barata para recuperar baseline defensiva."],
      ],
      checklist: [
        ["Entrar em maps com resistências elementais capadas", "gear", true],
        ["Completar o segundo lab", "lab", true],
        ["Fixar gem principal no setup alvo", "gem", true],
      ],
      notes: [
        "Mapas iniciais exigem consistência, não setup perfeito.",
        "Qualquer slot sem vida ou resistência vira dívida técnica da build.",
      ],
    },
    {
      label: "Stage 04",
      levelMin: 75,
      levelMax: 90,
      title: "Early endgame",
      summary: `Refina gear, fecha labs finais e transforma a build em um roteiro estável de sessão longa.`,
      passives: [
        ["Último cluster de eficiência", 64, "Completar os pontos que destravam conforto de endgame."],
        ["Jewel socket prioritário", 72, "Só abrir socket quando já existir jóia que realmente paga o custo."],
      ],
      gems: [
        ["main", profile.endgameSkill, [...profile.supportSet, "Inspiration"].slice(0, 4), ["Awakened support depois"], "Substituir suportes provisórios por links definitivos."],
        ["utility", profile.utilitySet[0], profile.utilitySet.slice(1), [profile.movementSkill], "Utility aqui vira checklist operacional por boss ou mapa."],
      ],
      gear: [
        ["weapon", [profile.weaponFocus], ["gem levels", "critical chance", "attack/cast speed"], profile.uniqueHint, "Arma e body armour são os upgrades de maior impacto nesse estágio."],
        ["jewellery", ["life", "resist", "attributes"], ["chaos resist", "damage suffix"], undefined, "Fechar jóias e joias do personagem melhora estabilidade sem refazer build."],
      ],
      checklist: [
        ["Preparar terceiro lab antes de forçar conteúdo acima do conforto", "lab", true],
        ["Definir primeira peça premium de upgrade", "gear", true],
        ["Pin o próximo breakpoint da build para a sessão atual", "note", false],
      ],
      notes: [
        "Endgame inicial é sobre escolher o próximo upgrade certo, não todos ao mesmo tempo.",
        "Se o overlay mostrar muita informação, esconder widgets antes de adicionar novos.",
      ],
    },
  ];

  return stages.map((stage, stageIndex) => {
    const stageId = `${buildId}-stage-${stageIndex + 1}`;

    return {
      id: stageId,
      buildId,
      order: stageIndex + 1,
      label: stage.label,
      levelMin: stage.levelMin,
      levelMax: stage.levelMax,
      title: stage.title,
      summary: stage.summary,
      passives: stage.passives.map((entry, index) =>
        stagePassive(stageId, index + 1, entry[0], entry[1], entry[2]),
      ),
      gems: stage.gems.map((entry, index) =>
        stageGem(stageId, index + 1, entry[0], entry[1], entry[2], entry[3], entry[4]),
      ),
      gear: stage.gear.map((entry, index) =>
        stageGear(stageId, index + 1, entry[0], entry[1], entry[2], entry[3], entry[4]),
      ),
      checklist: stage.checklist.map((entry, index) =>
        stageChecklist(stageId, index + 1, entry[0], entry[1], entry[2]),
      ),
      notes: stage.notes,
    };
  });
}

function createLabs(buildId: string, ascendancy: string): LabStep[] {
  return [
    {
      id: `${buildId}-lab-1`,
      order: 1,
      title: "Normal Lab",
      levelHint: "33-38",
      ascendancyChoice: `${ascendancy} - primeiros 2 pontos`,
      notes: "Entrar quando o 4-link básico estiver estável e frascos ajustados.",
    },
    {
      id: `${buildId}-lab-2`,
      order: 2,
      title: "Cruel Lab",
      levelHint: "55-60",
      ascendancyChoice: `${ascendancy} - aceleração de clear`,
      notes: "Ideal antes de maps ou no começo dos mapas brancos.",
    },
    {
      id: `${buildId}-lab-3`,
      order: 3,
      title: "Merciless Lab",
      levelHint: "68-75",
      ascendancyChoice: `${ascendancy} - nó defensivo`,
      notes: "Não empurrar tiers mais altos sem esse breakpoint se a build estiver sofrendo.",
    },
    {
      id: `${buildId}-lab-4`,
      order: 4,
      title: "Uber Lab",
      levelHint: "75+",
      ascendancyChoice: `${ascendancy} - finalização do setup`,
      notes: "Último lab entra como objetivo pinável, não como bloqueio duro de progressão.",
    },
  ];
}

export function createImportedBuild(sourceType: BuildSourceType, sourceValue: string): Build {
  const archetype = inferArchetype(sourceValue);
  const profile = archetypeProfiles[archetype];
  const id = crypto.randomUUID();
  const name = extractName(sourceType, sourceValue);
  const className = extractClassName(sourceValue, profile.classFallback);
  const ascendancy = extractAscendancy(sourceValue, profile.ascendancyFallback);
  const stages = createStages(id, profile);

  return {
    id,
    name,
    className,
    ascendancy,
    sourceType,
    sourceValue,
    importedAt: new Date().toISOString(),
    notes: extractNotes(sourceValue),
    warnings: [
      "Parser inicial: a importação gera uma timeline utilizável mesmo sem mapear 100% do XML do Path of Building.",
      "Conectar o export real do PoB é o próximo passo de engine, não deste scaffold.",
    ],
    summary: {
      tagline: `${profile.label} operacionalizada para sessões de 10-20 minutos sem alt-tab constante.`,
      playstyle: profile.playstyle,
      nextUpgrade: profile.nextUpgrade,
      warningCards: [
        "Evite tratar o overlay como automação. O produto continua manual.",
        "Sempre validar se a versão da build importada corresponde à liga atual.",
      ],
    },
    stages,
    labs: createLabs(id, ascendancy),
  };
}

export function createInitialProgress(build: Build): UserProgress {
  const firstStage = build.stages[0];

  return {
    id: crypto.randomUUID(),
    buildId: build.id,
    playerLevel: firstStage?.levelMin ?? 1,
    currentStageId: firstStage?.id ?? "",
    completedChecklistIds: [],
    pinnedItemIds: [],
    updatedAt: new Date().toISOString(),
  };
}
