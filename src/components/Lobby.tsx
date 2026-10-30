import type { GameController } from "../hooks/useGame.ts";
interface LobbyProps {
  game: GameController;
  present: number;
}
export default function Lobby({ game, present }: LobbyProps) {
  return (
    <section className="xm-sanh" aria-label="Gọi học sinh">
      <div className="xm-bang">
        <div className="xm-bang__dong">
          <span className="xm-bang__nhan">Số em</span>
          {[1, 2, 3, 4, 5].map((number) => (
            <button
              key={number}
              className={`xm-chip ${game.count === number ? "is-selected" : ""}`}
              disabled={number > Math.max(1, present)}
              aria-pressed={game.count === number}
              aria-label={`Gọi ${number} em`}
              onClick={() => game.setCount(number)}
            >
              {number}
            </button>
          ))}
        </div>
        <button
          className="xm-nut xm-nut--lon"
          disabled={present === 0}
          onClick={() => game.start()}
        >
          Gọi tên
        </button>
        <p className="xm-bang__goi-y">
          Bấm vào nhà để gọi đúng em đó. Giữ lâu để đánh dấu vắng.
          <br />
          <span>
            {present} em có mặt · {game.called.length} đã gọi
          </span>
          {game.called.length > 0 && (
            <>
              {" "}
              ·{" "}
              <button className="xm-lien-ket" onClick={game.reset}>
                Làm mới xóm
              </button>
            </>
          )}
          {present === 0 && (
            <>
              {" "}
              ·{" "}
              <button className="xm-lien-ket" onClick={game.clearAbsent}>
                Bỏ đánh dấu vắng
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
