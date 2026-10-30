import type { FormEvent } from "react";
import type { Classroom } from "../lib/classroom.ts";
interface RosterEditorProps {
  classroom: Classroom;
  onSave: (classroom: Classroom) => void;
  onClose: () => void;
}
import { useState } from "react";
import Modal from "./Modal.tsx";
import { DEMO_CLASSROOM, parseRoster } from "../lib/classroom.ts";
export default function RosterEditor({
  classroom,
  onSave,
  onClose,
}: RosterEditorProps) {
  const [title, setTitle] = useState(classroom.title);
  const [text, setText] = useState(
    classroom.roster
      .map(
        (name) =>
          `${name}${classroom.genders[name] ? ` | ${classroom.genders[name] === "nam" ? "nam" : "nữ"}` : ""}`,
      )
      .join("\n"),
  );
  const [error, setError] = useState("");
  const total = text.split("\n").filter((line) => line.trim()).length;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = parseRoster(text);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onSave({
      title: title.trim() || "Lớp của tôi",
      roster: result.roster,
      genders: result.genders,
      isDemo: false,
    });
  };
  return (
    <Modal className="roster-modal" labelledBy="roster-title" onClose={onClose}>
      <form onSubmit={save}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">CHUẨN BỊ LỚP HỌC</p>
            <h2 id="roster-title">Danh sách lớp</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng danh sách"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <label className="field">
          Tên lớp
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={60}
          />
        </label>
        <label className="field" htmlFor="roster">
          Học sinh <span>{total}/60 em</span>
        </label>
        <p id="roster-help" className="field-help">
          Mỗi dòng một em. Có thể thêm <strong>| nam</strong> hoặc{" "}
          <strong>| nữ</strong> sau tên để chọn nhân vật.
        </p>
        <textarea
          id="roster"
          aria-describedby="roster-help roster-error"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError("");
          }}
          rows={10}
          spellCheck={false}
          maxLength={12000}
        />
        <p id="roster-error" className="field-error" role="alert">
          {error}
        </p>
        <p className="field-help">
          Danh sách dùng chung cho mọi trò chơi và lưu trên trình duyệt này. Áp
          dụng sẽ bắt đầu phiên chơi mới.
        </p>
        <div className="editor-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => onSave(DEMO_CLASSROOM)}
          >
            Dùng lớp minh họa
          </button>
          <button type="submit" className="xm-nut">
            Lưu danh sách
          </button>
        </div>
      </form>
    </Modal>
  );
}
