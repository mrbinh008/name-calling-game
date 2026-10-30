export const GAME_IDS = [
  "village-summon",
  "dog-chase",
  "mango-poke",
  "jiangshi",
  "parent-call",
  "meteor",
] as const;
export type GameId = (typeof GAME_IDS)[number];
export type AnimatedGameId = Exclude<GameId, "village-summon">;

export interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  resultTitle: string;
  artwork: string;
  accent: string;
  duration: number;
  maxSelection: number;
  backgroundTrack?: string;
}

export const GAME_CATALOG: readonly GameDefinition[] = [
  {
    id: "village-summon",
    title: "Cả Xóm Trốn Trả Bài",
    subtitle: "Gõ cửa từng nhà",
    description:
      "Theo chân gà công an đi khắp xóm, tìm các bạn đang trốn trả bài.",
    resultTitle: "GIẤY TRIỆU TẬP",
    artwork: "/images/games/village-summon.webp",
    accent: "#287744",
    duration: 33,
    maxSelection: 5,
  },
  {
    id: "dog-chase",
    title: "Mực Ơi, Đừng Dậy!",
    subtitle: "Đi khẽ, nói nhỏ",
    description:
      "Cả lớp rón rén đi qua Mực đang ngủ. Bạn nào sẽ bị Mực đuổi theo?",
    resultTitle: "MỰC ĐÃ CHỌN!",
    artwork: "/images/games/dog-chase.webp",
    accent: "#b56c22",
    duration: 24,
    maxSelection: 1,
    backgroundTrack: "/games/dog-chase/am/nhac-ron-ren.mp3",
  },
  {
    id: "mango-poke",
    title: "Chọc Xoài Chấm Muối",
    subtitle: "Một vườn đầy bất ngờ",
    description:
      "Rủ nhau ra vườn chọc xoài. Xoài rụng trúng ai, người đó lên bảng!",
    resultTitle: "XOÀI RỤNG RỒI!",
    artwork: "/images/games/mango-poke.webp",
    accent: "#75872b",
    duration: 22,
    maxSelection: 1,
    backgroundTrack: "/games/mango-poke/am/nen-vuon.mp3",
  },
  {
    id: "jiangshi",
    title: "Thử Thách Linh Phù",
    subtitle: "Lá bùa chọn ai?",
    description:
      "Bước vào sân đèn lồng, theo dõi lá bùa bay và chờ người được chọn.",
    resultTitle: "LINH PHÙ ĐÃ CHỌN!",
    artwork: "/images/games/jiangshi.webp",
    accent: "#88508f",
    duration: 45,
    maxSelection: 2,
    backgroundTrack: "/cuong-thi/v2/am/nhac-san.flac",
  },
  {
    id: "parent-call",
    title: "Cô Gọi Về Nhà",
    subtitle: "Tin nhắn từ cô giáo",
    description:
      "Một cuộc gọi bất ngờ trong nhóm phụ huynh. Cô đang nhắc đến bạn nào?",
    resultTitle: "CÔ MỜI EM LÊN BẢNG!",
    artwork: "/images/games/parent-call.webp",
    accent: "#2778b6",
    duration: 24,
    maxSelection: 1,
  },
  {
    id: "meteor",
    title: "Thiên Thạch Điểm Danh",
    subtitle: "Cẩn thận trên đầu!",
    description:
      "Một ngày bình yên trên phố, bỗng có thiên thạch tìm đúng người cần trả bài.",
    resultTitle: "THIÊN THẠCH ĐIỂM DANH!",
    artwork: "/images/games/meteor.webp",
    accent: "#c5633f",
    duration: 26,
    maxSelection: 1,
  },
];

export function isGameId(value: string): value is GameId {
  return GAME_IDS.some((id) => id === value);
}

export function parseGameRoute(hash: string): GameId | null {
  const match = /^#\/games\/([a-z-]+)\/?$/.exec(hash);
  return match && isGameId(match[1]) ? match[1] : null;
}

export function getGameDefinition(id: GameId): GameDefinition {
  const definition = GAME_CATALOG.find((game) => game.id === id);
  if (!definition) throw new Error(`Unknown game: ${id}`);
  return definition;
}
