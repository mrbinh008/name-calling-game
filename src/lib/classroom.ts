import type { Gender, GenderByName } from "../game/types.ts";
export interface Classroom {
  title: string;
  isDemo: boolean;
  roster: string[];
  genders: GenderByName;
}
export type RosterParseResult =
  | {
      error: null;
      roster: string[];
      genders: GenderByName;
    }
  | {
      error: string;
    };
type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;
const STORAGE_KEY = "ca-xom-classroom-v1";
export const DEMO_CLASSROOM: Classroom = {
  title: "Lớp học vui vẻ",
  isDemo: true,
  roster: [
    "Nguyễn Minh Anh",
    "Trần Quốc Bảo",
    "Lê Ngọc Châu",
    "Phạm Thành Đạt",
    "Hoàng Hà Giang",
    "Vũ Gia Hân",
    "Đặng Trung Hiếu",
    "Bùi Khánh Linh",
    "Đỗ Quang Huy",
    "Ngô Phương Mai",
    "Hồ Tuấn Kiệt",
    "Dương Bảo Ngọc",
    "Lý Đức Minh",
    "Võ Yến Nhi",
    "Đinh Hoàng Nam",
    "Nguyễn Hải Yến",
    "Trần Minh Quân",
    "Lê Thảo Vy",
    "Phạm Anh Tú",
    "Hoàng Thanh Trúc",
    "Vũ Nhật Khang",
    "Đặng Thu Hà",
    "Bùi Gia Phúc",
    "Đỗ Kim Chi",
  ],
  genders: {},
};
export function parseRoster(text: string): RosterParseResult {
  const roster: string[] = [];
  const genderEntries: [string, Gender][] = [];
  const seenNames = new Set<string>();
  for (const line of text.split(/\r?\n/).filter((line) => line.trim())) {
    const [rawName, rawGender = "", ...extraFields] = line.split("|");
    const name = rawName.normalize("NFC").trim().replace(/\s+/g, " ");
    const gender = rawGender.trim().toLocaleLowerCase("vi");
    if (!name || name.length > 80)
      return {
        error: "Mỗi tên cần có từ 1 đến 80 ký tự.",
      };
    if (extraFields.length || (gender && !["nam", "nữ", "nu"].includes(gender)))
      return {
        error: "Giới tính tùy chọn: ghi “| nam” hoặc “| nữ” sau tên.",
      };
    const normalizedName = name.toLocaleLowerCase("vi");
    if (seenNames.has(normalizedName))
      return {
        error: `Tên “${name}” bị trùng. Hãy thêm ký hiệu để phân biệt hai em.`,
      };
    seenNames.add(normalizedName);
    roster.push(name);
    if (gender) genderEntries.push([name, gender === "nam" ? "nam" : "nu"]);
  }
  if (!roster.length)
    return {
      error: "Hãy nhập ít nhất một học sinh.",
    };
  if (roster.length > 60)
    return {
      error: "Xóm có tối đa 60 em. Hãy chia danh sách thành các lớp nhỏ hơn.",
    };
  return {
    roster,
    genders: Object.fromEntries(genderEntries),
    error: null,
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  );
}
export function loadClassroom(storage?: StorageReader): Classroom {
  try {
    const rawClassroom = (storage ?? window.localStorage).getItem(STORAGE_KEY);
    if (rawClassroom === null) return DEMO_CLASSROOM;
    const saved: unknown = JSON.parse(rawClassroom);
    if (
      !isRecord(saved) ||
      !isStringArray(saved.roster) ||
      !isRecord(saved.genders)
    )
      return DEMO_CLASSROOM;
    const genders = saved.genders;
    const parsed = parseRoster(
      saved.roster
        .map(
          (name) =>
            `${name}${Object.hasOwn(genders, name) ? ` | ${genders[name]}` : ""}`,
        )
        .join("\n"),
    );
    if (parsed.error !== null) return DEMO_CLASSROOM;
    return {
      title:
        typeof saved.title === "string"
          ? saved.title.slice(0, 60)
          : "Lớp của tôi",
      roster: parsed.roster,
      genders: parsed.genders,
      isDemo: saved.isDemo === true,
    };
  } catch {
    return DEMO_CLASSROOM;
  }
}
export function saveClassroom(
  classroom: Classroom,
  storage?: StorageWriter,
): boolean {
  try {
    (storage ?? window.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify(classroom),
    );
    return true;
  } catch {
    return false;
  }
}
