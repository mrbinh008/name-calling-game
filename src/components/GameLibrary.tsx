import { useState, type CSSProperties } from "react";
import { GAME_CATALOG } from "@/games/catalog.ts";
import type { Classroom } from "@/lib/classroom.ts";

interface GameLibraryProps {
  classroom: Classroom;
  onEditRoster: () => void;
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export default function GameLibrary({
  classroom,
  onEditRoster,
}: GameLibraryProps) {
  const [search, setSearch] = useState("");
  const games = GAME_CATALOG.filter((game) =>
    normalizeSearch(`${game.title} ${game.subtitle}`).includes(
      normalizeSearch(search),
    ),
  );
  return (
    <main className="library-page">
      <header className="library-header">
        <a className="library-brand" href="#/">
          <span aria-hidden="true">✦</span> LỚP MÌNH CHƠI
        </a>
        <button className="library-class-button" onClick={onEditRoster}>
          <span aria-hidden="true">☷</span> Danh sách lớp{" "}
          <span>{classroom.roster.length}</span>
        </button>
      </header>
      <section className="library-intro">
        <div>
          <p className="library-eyebrow">MỘT CHÚT HỒI HỘP · CẢ LỚP CÙNG VUI</p>
          <h1>
            Hôm nay,
            <br />
            lớp mình chơi gì<span>?</span>
          </h1>
          <p className="library-description">
            Biến phút gọi tên thành một cuộc phiêu lưu.
            <br />
            Chọn trò chơi, cả lớp sẵn sàng!
          </p>
        </div>
        <aside className="library-class-note">
          <span className="library-note-pin" aria-hidden="true">
            ✦
          </span>
          <p>LỚP ĐÃ SẴN SÀNG</p>
          <strong>{classroom.title}</strong>
          <span>
            {classroom.roster.length} học sinh
            {classroom.isDemo ? " · Lớp minh họa" : ""}
          </span>
          <button onClick={onEditRoster}>
            Chỉnh danh sách <span aria-hidden="true">↗</span>
          </button>
        </aside>
      </section>
      <section className="library-games" aria-labelledby="library-games-title">
        <div className="library-section-bar">
          <div>
            <h2 id="library-games-title">Kho trò chơi</h2>
            <span>{GAME_CATALOG.length} cuộc phiêu lưu đang chờ</span>
          </div>
          <label className="library-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Tìm trò chơi"
              placeholder="Tìm trò chơi…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="library-grid">
          {games.map((game, index) => (
            <a
              className="library-game"
              href={`#/games/${game.id}`}
              aria-label={`Chơi ${game.title}`}
              style={{ "--game-accent": game.accent } as CSSProperties}
              key={game.id}
            >
              <div className="library-game-art">
                <img
                  src={game.artwork}
                  alt=""
                  loading={index > 2 ? "lazy" : "eager"}
                />
                <span className="library-game-number">
                  0{GAME_CATALOG.indexOf(game) + 1}
                </span>
                <span className="library-play" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="library-game-copy">
                <span>{game.subtitle}</span>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <div>
                  <span>Gọi tên học sinh</span>
                  <span>
                    {game.maxSelection === 1
                      ? "1 em / lượt"
                      : `1–${game.maxSelection} em / lượt`}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
        {games.length === 0 && (
          <div className="library-empty" role="status">
            <p>Chưa tìm thấy trò chơi phù hợp.</p>
            <button onClick={() => setSearch("")}>Xem tất cả trò chơi</button>
          </div>
        )}
      </section>
      <footer className="library-footer">
        <span>Học một chút. Chơi một chút. Nhớ nhau thật nhiều.</span>
        <span>✦ Lớp mình chơi</span>
      </footer>
    </main>
  );
}
