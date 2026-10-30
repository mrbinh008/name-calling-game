import { useEffect, useState } from "react";
import { villageAudio } from "@/game/audio.ts";
import { gameAudio } from "@/game/sound.ts";
export interface BackgroundAudio {
  startBackground(): void;
  stopBackground(): void;
}
export function useGamePreferences(
  playing: boolean,
  paused: boolean,
  audio: BackgroundAudio = villageAudio,
) {
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem("ca-xom-sound") !== "off";
    } catch {
      return true;
    }
  });
  const [fullscreen, setFullscreen] = useState(() =>
    Boolean(document.fullscreenElement ?? document.webkitFullscreenElement),
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    gameAudio.setEnabled(sound);
    if (!sound || paused) audio.stopBackground();
    else if (playing) audio.startBackground();
    try {
      localStorage.setItem("ca-xom-sound", sound ? "on" : "off");
    } catch {
      /* Session preference still works. */
    }
  }, [sound, playing, paused, audio]);
  useEffect(() => {
    const update = () =>
      setFullscreen(
        Boolean(document.fullscreenElement ?? document.webkitFullscreenElement),
      );
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (fullscreen)
        await (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(
          document,
        );
      else {
        const enter =
          document.documentElement.requestFullscreen ??
          document.documentElement.webkitRequestFullscreen;
        if (!enter) {
          setMessage("Trình duyệt này chưa hỗ trợ toàn màn hình.");
          return;
        }
        await enter.call(document.documentElement);
      }
    } catch {
      setMessage("Chưa mở được toàn màn hình. Hãy thử lại bằng nút này.");
    }
  };
  return {
    sound,
    setSound,
    fullscreen,
    message,
    setMessage,
    toggleFullscreen,
  };
}
