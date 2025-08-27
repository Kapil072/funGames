import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Coffee, Droplets, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BubbleBlast } from "./BubbleBlast";

interface CoffeeSpillCrisisProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface FallingCup {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'espresso' | 'latte' | 'cappuccino' | 'americano';
  caught: boolean;
  spilled: boolean;
}

const CoffeeSpillCrisis = ({ onGameComplete, onBack }: CoffeeSpillCrisisProps) => {
  const [cups, setCups] = useState<FallingCup[]>([]);
  const [score, setScore] = useState(0);
  const [stressLevel, setStressLevel] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextCupId, setNextCupId] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [blasts, setBlasts] = useState<{ x: number; y: number; id: number }[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);

  const cupTypes = [
    { type: 'espresso' as const, points: 15, speed: 2, emoji: '☕', color: 'text-amber-800' },
    { type: 'latte' as const, points: 20, speed: 1.5, emoji: '🥛', color: 'text-amber-600' },
    { type: 'cappuccino' as const, points: 25, speed: 1.8, emoji: '☕', color: 'text-amber-700' },
    { type: 'americano' as const, points: 30, speed: 1.2, emoji: '☕', color: 'text-amber-900' }
  ];

  const coffeeMessages = [
    "Monday morning fuel!",
    "Emergency caffeine!",
    "Meeting survival kit!",
    "Deadline companion!",
    "Brain juice!",
    "Productivity potion!",
    "Zoom call essential!",
    "Code review buddy!",
    "Bug fix fuel!",
    "Deployment coffee!"
  ];

  const spawnCup = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    if (now - lastSpawnRef.current < 1500) return;
    lastSpawnRef.current = now;

    const x = Math.random() * 80 + 10;
    const randomType = cupTypes[Math.floor(Math.random() * cupTypes.length)];
    const id = nextCupId;
    
    const newCup: FallingCup = {
      id,
      x,
      y: -10,
      speed: randomType.speed,
      type: randomType.type,
      caught: false,
      spilled: false
    };

    setCups(prev => [...prev, newCup]);
    setNextCupId(prev => prev + 1);

    // Remove cup if it falls off screen
    setTimeout(() => {
      setCups(prev => {
        const found = prev.find(c => c.id === id && !c.caught);
        if (found) {
          setStressLevel(prev => Math.min(100, prev + 8));
        }
        return prev.filter(c => c.id !== id);
      });
    }, 8000);
  }, [gameActive, nextCupId]);

  const catchCup = (cupId: number) => {
    setCups(prev =>
      prev.map(cup =>
        cup.id === cupId
          ? { ...cup, caught: true }
          : cup
      )
    );
    
    const cup = cups.find(c => c.id === cupId);
    if (cup) {
      const cupType = cupTypes.find(t => t.type === cup.type);
      const points = cupType?.points || 10;
      setScore(prev => prev + points);
      setStressLevel(prev => Math.max(0, prev - 2));
      
      setBlasts(prev => [
        ...prev,
        { x: cup.x, y: cup.y, id: cupId }
      ]);
    }
  };

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    spawnCup();

    setCups(prev => {
      const updatedCups = prev.map(cup => ({
        ...cup,
        y: cup.y + cup.speed
      }));

      // Check for spilled cups (hit ground)
      const remainingCups: FallingCup[] = [];
      let stressIncrease = 0;

      updatedCups.forEach(cup => {
        if (cup.caught) {
          // Remove caught cups after animation
          setTimeout(() => {
            setCups(current => current.filter(c => c.id !== cup.id));
          }, 300);
        } else if (cup.y > 90) {
          // Cup spilled - increase stress
          stressIncrease += 10;
        } else {
          remainingCups.push(cup);
        }
      });

      if (stressIncrease > 0) {
        setStressLevel(prev => Math.min(100, prev + stressIncrease));
      }

      return remainingCups;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, spawnCup]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setStressLevel(0);
    setCups([]);
    setNextCupId(0);
    lastSpawnRef.current = 0;
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const earnedXp = Math.floor(score * 1.2) + Math.max(0, 100 - stressLevel);
    onGameComplete(earnedXp);
  }, [score, stressLevel, onGameComplete]);

  // Game loop effect
  useEffect(() => {
    if (gameActive) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameLoop]);

  // Check game over conditions
  useEffect(() => {
    if (stressLevel >= 100) {
      endGame();
    }
  }, [stressLevel, endGame]);

  // Mouse/touch movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameActive || !gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setPlayerX(Math.max(10, Math.min(90, x)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gameActive || !gameAreaRef.current) return;
      e.preventDefault();
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      setPlayerX(Math.max(10, Math.min(90, x)));
    };

    if (gameActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameActive]);

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Coffee Crisis Over!</h2>
          <p className="text-gray-600 mb-6">
            You saved {score} coffee points worth of sanity!
          </p>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full bg-amber-600 hover:bg-amber-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">☕ Coffee Spill Crisis</h2>
            <p className="text-sm text-gray-600">Catch the coffee before it spills!</p>
          </div>
          <Button onClick={startGame} variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{score}</div>
            <div className="text-xs text-gray-600">Coffee Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stressLevel}%</div>
            <div className="text-xs text-gray-600">Stress Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{cups.filter(c => c.caught).length}</div>
            <div className="text-xs text-gray-600">Cups Saved</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={stressLevel} className="h-3" />
          <div className="text-xs text-gray-500 mt-1">
            {stressLevel >= 80 ? "😰 PANIC MODE!" : stressLevel >= 60 ? "😟 Getting stressed..." : "😌 Stay calm!"}
          </div>
        </div>

        {/* Game Area */}
        <div
          ref={gameAreaRef}
          className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl h-96 border-4 border-amber-200 overflow-hidden"
          style={{ cursor: 'none' }}
        >
          {/* Player (Coffee Cup) */}
          <div
            className="absolute bottom-4 text-4xl transition-all duration-100 ease-out"
            style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
          >
            ☕
          </div>

          {/* Falling Cups */}
          {cups.map(cup => {
            const cupType = cupTypes.find(t => t.type === cup.type);
            return (
              <div
                key={cup.id}
                className={`absolute text-3xl cursor-pointer transition-all duration-200 ${
                  cup.caught ? 'scale-150 opacity-0' : 'hover:scale-110'
                }`}
                style={{
                  left: `${cup.x}%`,
                  top: `${cup.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => !cup.caught && catchCup(cup.id)}
              >
                <div className={cupType?.color || 'text-amber-600'}>
                  {cupType?.emoji || '☕'}
                </div>
                {!cup.caught && (
                  <div className="text-xs text-gray-600 mt-1 text-center whitespace-nowrap">
                    {coffeeMessages[Math.floor(Math.random() * coffeeMessages.length)]}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bubble Blasts */}
          {blasts.map(blast => (
            <BubbleBlast
              key={blast.id}
              x={`${blast.x}%`}
              y={`${blast.y}%`}
              onEnd={() => {
                setBlasts(prev => prev.filter(b => b.id !== blast.id));
              }}
            />
          ))}

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-300"></div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Move your mouse to catch falling coffee cups before they spill!</p>
          <p className="mt-1">Different cups give different points. Don't let stress reach 100%!</p>
        </div>
      </div>
    </div>
  );
};

export default CoffeeSpillCrisis; 