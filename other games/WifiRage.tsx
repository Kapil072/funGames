import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Wifi, WifiOff, Signal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface WifiBar {
  id: number;
  height: number;
  isFlickering: boolean;
  color: string;
  targetHeight: number;
}

const WifiRage = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [wifiBars, setWifiBars] = useState<WifiBar[]>([]);
  const [tapStreak, setTapStreak] = useState(0);
  const [connectionStability, setConnectionStability] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    setTimeLeft(45);
    setTapStreak(0);
    setConnectionStability(0);
    
    // Initialize wifi bars
    const bars: WifiBar[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      height: Math.random() * 30 + 10,
      isFlickering: Math.random() > 0.5,
      color: '#ef4444',
      targetHeight: 80 + i * 20
    }));
    setWifiBars(bars);
  }, []);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    setTimeLeft(45);
    setTapStreak(0);
    setConnectionStability(0);
    setWifiBars([]);
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  }, []);

  // Timer
  useEffect(() => {
    if (gameActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameWon(false);
            setGameActive(false);
            const finalXP = score * 5;
            onGameComplete(finalXP);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, gameOver, score, onGameComplete]);

  // Game loop - make bars flicker and decrease
  useEffect(() => {
    if (gameActive && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        setWifiBars(prev => prev.map(bar => ({
          ...bar,
          height: Math.max(5, bar.height - Math.random() * 15),
          isFlickering: Math.random() > 0.3,
          color: bar.height < 30 ? '#ef4444' : bar.height < 60 ? '#f59e0b' : '#10b981'
        })));
        
        setConnectionStability(prev => Math.max(0, prev - 2));
      }, 500);
    }
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameActive, gameOver]);

  const tapWifiBar = useCallback((barId: number) => {
    if (!gameActive) return;
    
    setWifiBars(prev => prev.map(bar => {
      if (bar.id === barId) {
        const newHeight = Math.min(bar.targetHeight, bar.height + 25);
        return {
          ...bar,
          height: newHeight,
          isFlickering: false,
          color: newHeight >= bar.targetHeight * 0.8 ? '#10b981' : '#f59e0b'
        };
      }
      return bar;
    }));
    
    setTapStreak(prev => prev + 1);
    setScore(prev => prev + 10 + Math.floor(tapStreak / 5) * 5);
    setConnectionStability(prev => Math.min(100, prev + 5));
  }, [gameActive, tapStreak]);

  // Check win condition
  useEffect(() => {
    if (gameActive && !gameOver && connectionStability >= 100) {
      // Check if all 4 WiFi bars are above 70% of their target height
      const allBarsAbove70 = wifiBars.every(bar => 
        (bar.height / bar.targetHeight) >= 0.7
      );
      
      if (allBarsAbove70) {
        setGameOver(true);
        setGameWon(true);
        setGameActive(false);
        const finalXP = score * 5 + 200; // Bonus for winning
        onGameComplete(finalXP);
      }
    }
  }, [gameActive, gameOver, connectionStability, wifiBars, score, onGameComplete]);

  const getConnectionStatus = () => {
    if (connectionStability < 25) return { text: "Connection Lost", color: "text-red-600" };
    if (connectionStability < 50) return { text: "Poor Connection", color: "text-orange-600" };
    if (connectionStability < 75) return { text: "Fair Connection", color: "text-yellow-600" };
    if (connectionStability < 100) return { text: "Strong Connection", color: "text-green-600" };
    return { text: "Perfect Connection!", color: "text-green-600" };
  };

  return (
    <div className="text-center text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 text-center w-full">
          WiFi Rage
        </h2>
        
        <Button
          variant="ghost"
          size="lg"
          onClick={startGame}
          className="text-white hover:bg-white/20"
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          {gameActive ? 'Restart' : 'Start'}
        </Button>
      </div>

      <div className="bg-blue-600/30 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-blue-300/30">
        {/* Game Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-lg font-semibold text-black">Score: {score}</p>
            <p className="text-sm text-black">Tap Streak: {tapStreak}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black">{timeLeft}s</p>
            <p className="text-sm text-black">Time Left</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-black">Connection</p>
            <p className="text-xs text-black">{getConnectionStatus().text}</p>
          </div>
        </div>

        {/* Connection Stability Bar */}
        <div className="mb-4">
          <p className="text-xs text-black mb-1">Connection Stability</p>
          <div className="w-full bg-blue-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                connectionStability < 25 ? 'bg-red-500' :
                connectionStability < 50 ? 'bg-orange-500' :
                connectionStability < 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${connectionStability}%` }}
            />
          </div>
          <p className="text-xs text-black mt-1">{connectionStability}%</p>
        </div>

        {/* Game Area */}
        <div className="relative w-full h-96 bg-gradient-to-b from-blue-800/50 to-blue-900/30 rounded-xl border-2 border-blue-300/50 overflow-hidden">
          
          {/* WiFi Bars Display */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-end justify-center gap-3 h-32">
              {wifiBars.map((bar, index) => (
                <div
                  key={bar.id}
                  className="relative cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => tapWifiBar(bar.id)}
                >
                  <div
                    className={`w-8 rounded-t transition-all duration-300 ${
                      bar.isFlickering ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: `${bar.height}px`,
                      backgroundColor: bar.color,
                    }}
                  />
                  <div className="text-xs text-center mt-1 text-white">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Wifi className={`w-8 h-8 mx-auto ${connectionStability > 50 ? 'text-green-400' : 'text-red-400'}`} />
              <div className="text-sm text-blue-200 mt-1">Tap the bars to boost signal!</div>
            </div>
          </div>

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
              {gameOver ? (
                <div className="text-center">
                  {gameWon ? (
                    <>
                      <h3 className="text-3xl font-bold mb-4 text-green-300">WiFi Victory!</h3>
                      <p className="text-xl mb-2 text-white">Perfect Connection Achieved!</p>
                      <p className="text-lg mb-2 text-gray-200">Score: {score}</p>
                      <p className="text-lg mb-4 text-green-300">+{score * 5 + 200} XP earned!</p>
                      <p className="text-sm text-gray-300 italic">Finally, stable internet!</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-3xl font-bold mb-4 text-red-300">Connection Lost</h3>
                      <p className="text-xl mb-2 text-white">Time ran out!</p>
                      <p className="text-lg mb-2 text-gray-200">Score: {score}</p>
                      <p className="text-lg mb-4 text-gray-200">+{score * 5} XP earned!</p>
                      <p className="text-sm text-gray-300 italic">Better luck next time!</p>
                    </>
                  )}
                  <Button 
                    onClick={startGame}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Wifi className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-blue-200">WiFi Rage</h3>
                  <p className="text-lg mb-2 text-white">Fix your WiFi connection!</p>
                  <p className="text-sm text-blue-300 mb-4">Tap the bars to boost signal strength!</p>
                  <Button 
                    onClick={startGame}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Start Fixing
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-black">
          <p>📶 Tap WiFi bars to increase signal strength</p>
          <p>⚡ Get connection stability to 100% to win</p>
          <p>🎯 All 4 bars must be above 70% for victory!</p>
        </div>
      </div>
    </div>
  );
};

export default WifiRage;