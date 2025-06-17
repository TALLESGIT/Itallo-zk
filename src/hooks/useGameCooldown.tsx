import { useState, useEffect, useCallback } from 'react';

interface UseGameCooldownResult {
  cooldownSeconds: number;
  isCoolingDown: boolean;
  setCooldown: (durationInSeconds: number) => void;
  CooldownMessage: React.FC;
}

const COOLDOWN_STORAGE_KEY_PREFIX = 'game_cooldown_';

const useGameCooldown = (gameId: string): UseGameCooldownResult => {
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);

  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem(`${COOLDOWN_STORAGE_KEY_PREFIX}${gameId}`);
    if (storedCooldownEnd) {
      const remainingSeconds = Math.max(0, Math.floor((parseInt(storedCooldownEnd) - Date.now()) / 1000));
      if (remainingSeconds > 0) {
        setCooldownSeconds(remainingSeconds);
        setIsCoolingDown(true);
      } else {
        localStorage.removeItem(`${COOLDOWN_STORAGE_KEY_PREFIX}${gameId}`);
      }
    }
  }, [gameId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCoolingDown && cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            setIsCoolingDown(false);
            localStorage.removeItem(`${COOLDOWN_STORAGE_KEY_PREFIX}${gameId}`);
            clearInterval(timer);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else if (cooldownSeconds === 0 && isCoolingDown) {
      setIsCoolingDown(false);
      localStorage.removeItem(`${COOLDOWN_STORAGE_KEY_PREFIX}${gameId}`);
    }

    return () => clearInterval(timer);
  }, [isCoolingDown, cooldownSeconds, gameId]);

  const setCooldown = useCallback((durationInSeconds: number) => {
    const cooldownEndTime = Date.now() + durationInSeconds * 1000;
    localStorage.setItem(`${COOLDOWN_STORAGE_KEY_PREFIX}${gameId}`, cooldownEndTime.toString());
    setCooldownSeconds(durationInSeconds);
    setIsCoolingDown(true);
  }, [gameId]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const CooldownMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-3">Uh oh! Hora de uma pausa!</h2>
      <p className="text-lg mb-4">Você atingiu o limite de tentativas ou o tempo esgotou.</p>
      <p className="text-4xl font-extrabold mb-4 animate-pulse">Tempo restante: {formatTime(cooldownSeconds)}</p>
      <p className="text-base">Prepare-se para a próxima rodada! Agradecemos a sua paciência.</p>
    </div>
  );

  return {
    cooldownSeconds,
    isCoolingDown,
    setCooldown,
    CooldownMessage,
  };
};

export default useGameCooldown; 