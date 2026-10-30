import Modal from "@/components/Modal.tsx";
import type { GameDefinition } from "@/games/catalog.ts";

interface PickerResultProps {
  definition: GameDefinition;
  names: string[];
  onNext: () => void;
  onHome: () => void;
}

export default function PickerResult({
  definition,
  names,
  onNext,
  onHome,
}: PickerResultProps) {
  const isDogChase = definition.id === "dog-chase";

  return (
    <Modal
      className={`picker-result picker-result--${definition.id}`}
      labelledBy="picker-result-title"
      onClose={onHome}
    >
      {isDogChase ? (
        <div className="dog-chase-result-card">
          <img
            src="/games/dog-chase/do/sao.webp"
            alt=""
            className="dog-chase-star dog-chase-star--left"
            aria-hidden="true"
          />
          <img
            src="/games/dog-chase/do/sao.webp"
            alt=""
            className="dog-chase-star dog-chase-star--right"
            aria-hidden="true"
          />
          <div className="dog-chase-banner">
            <span>🐾 Mực đã chọn 🐾</span>
          </div>
          <div className="dog-chase-body">
            <h2 id="picker-result-title" className="sr-only">
              {definition.resultTitle}
            </h2>
            <ul className="picker-result-names dog-chase-names">
              {names.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <div className="dog-chase-actions">
              <button
                type="button"
                className="dog-chase-next-btn"
                onClick={onNext}
                autoFocus
              >
                <span className="dog-chase-next-icon" aria-hidden="true">
                  ▶
                </span>
                <span>Gọi tiếp</span>
              </button>
              <button
                type="button"
                className="dog-chase-home-btn"
                onClick={onHome}
              >
                Về sân chơi
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="picker-result-eyebrow">ĐẾN LƯỢT TRẢ BÀI RỒI</p>
          <h2 id="picker-result-title">{definition.resultTitle}</h2>
          <p>Mời {names.length > 1 ? "các em" : "em"}</p>
          <ul className="picker-result-names">
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="picker-result-invitation">Lên bảng cùng cả lớp nào!</p>
          <div className="xm-giay__nut">
            <button className="xm-nut xm-nut--lon" onClick={onNext} autoFocus>
              Gọi tiếp
            </button>
            <button className="xm-nut xm-nut--phu" onClick={onHome}>
              Về sân chơi
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
