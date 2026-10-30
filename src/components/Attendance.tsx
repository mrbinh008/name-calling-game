interface AttendanceProps {
  roster: string[];
  absent: string[];
  called: string[];
  onToggle: (name: string) => void;
  onCall: (name: string) => void;
  onClose: () => void;
}
import Modal from "./Modal.tsx";
export default function Attendance({
  roster,
  absent,
  called,
  onToggle,
  onCall,
  onClose,
}: AttendanceProps) {
  return (
    <Modal
      className="attendance-modal"
      labelledBy="attendance-title"
      onClose={onClose}
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">SỔ ĐIỂM DANH</p>
          <h2 id="attendance-title">Hôm nay ai đi học?</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Đóng điểm danh"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <p className="field-help">
        Bỏ chọn để đánh dấu vắng. Bấm “Gọi” để chọn đúng em đó.
      </p>
      <ul className="attendance-list">
        {roster.map((name) => (
          <li key={name}>
            <label>
              <input
                type="checkbox"
                checked={!absent.includes(name)}
                onChange={() => onToggle(name)}
              />
              <span>
                {name}
                {called.includes(name) && <small>Đã gọi</small>}
              </span>
            </label>
            <button
              className="text-button"
              disabled={absent.includes(name)}
              onClick={() => onCall(name)}
            >
              Gọi
            </button>
          </li>
        ))}
      </ul>
      <button className="xm-nut attendance-done" onClick={onClose}>
        Xong · {roster.length - absent.length} em có mặt
      </button>
    </Modal>
  );
}
