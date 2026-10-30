import type { CSSProperties } from "react";
interface ResultProps {
  selected: string[];
  calledCount: number;
  onNext: () => void;
  onHome: () => void;
}
import Modal from "@/components/Modal.tsx";
export default function Result({
  selected,
  calledCount,
  onNext,
  onHome,
}: ResultProps) {
  return (
    <Modal
      className="result-modal xm-giay"
      labelledBy="result-title"
      onClose={onHome}
    >
      <div className="xm-giay__dau">
        <span>CÔNG AN XÓM GÀ</span>
        <span>Số: {String(calledCount + 1).padStart(3, "0")}/TT</span>
      </div>
      <h2 id="result-title" className="xm-giay__tieu-de">
        GIẤY TRIỆU TẬP
      </h2>
      <p className="xm-giay__moi">
        Triệu tập {selected.length > 1 ? "các em" : "em"}
      </p>
      <div
        className={`xm-giay__ds xm-giay__ds--${Math.min(selected.length, 3)}`}
      >
        {selected.map((name) => (
          <div
            className="xm-giay__ten"
            style={
              {
                "--name-length": Math.max(12, name.length),
              } as CSSProperties
            }
            key={name}
          >
            {name}
          </div>
        ))}
      </div>
      <p className="xm-giay__loi">Lên bảng trả bài ngay!</p>
      <div className="xm-giay__dau-do" aria-hidden="true">
        <span>ĐÃ</span>
        <span>TRIỆU TẬP</span>
      </div>
      <div className="xm-giay__nut">
        <button className="xm-nut xm-nut--lon" onClick={onNext} autoFocus>
          Gọi tiếp
        </button>
        <button className="xm-nut xm-nut--phu" onClick={onHome}>
          Về xóm
        </button>
      </div>
    </Modal>
  );
}
