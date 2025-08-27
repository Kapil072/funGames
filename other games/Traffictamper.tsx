import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Timer } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Vehicle {
  id: number;
  x: number;
  y: number;
  type: 'car' | 'rickshaw' | 'bus';
  color: string;
  width: number;
  height: number;
  isSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

const TrafficTamer = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [clearedVehicles, setClearedVehicles] = useState(0);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  
  const GRID_SIZE = 40;
  const GAME_WIDTH = 480;
  const GAME_HEIGHT = 480;

  const generateLevel = useCallback((levelNum: number) => {
    const vehicleTypes = ['car', 'rickshaw', 'bus'] as const;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    const newVehicles: Vehicle[] = [];
    const numVehicles = Math.min(8 + levelNum, 15);
    
    for (let i = 0; i < numVehicles; i++) {
      const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const width = type === 'bus' ? 2 : 1;
      const height = type === 'car' ? 2 : 1;
      
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * (12 - width));
        y = Math.floor(Math.random() * (12 - height));
        attempts++;
      } while (attempts < 50 && newVehicles.some(v => 
        x < v.x + v.width && x + width > v.x && y < v.y + v.height && y + height > v.y
      ));
      
      if (attempts < 50) {
        newVehicles.push({
          id: i,
          x: x * GRID_SIZE,
          y: y * GRID_SIZE,
          type,
          color: colors[Math.floor(Math.random() * colors.length)],
          width: width * GRID_SIZE,
          height: height * GRID_SIZE,
          isSelected: false,
          canMoveUp: true,
          canMoveDown: true,
          canMoveLeft: true,
          canMoveRight: true
        });
      }
    }
    
    setVehicles(newVehicles);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setTimeLeft(30);
    setClearedVehicles(0);
    generateLevel(1);
  }, [generateLevel]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setTimeLeft(30);
    setClearedVehicles(0);
    setVehicles([]);
    setSelectedVehicle(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameActive(false);
            const finalXP = score * 10;
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

  const checkCollision = (vehicle: Vehicle, newX: number, newY: number, excludeId: number) => {
    return vehicles.some(v => 
      v.id !== excludeId && 
      newX < v.x + v.width && 
      newX + vehicle.width > v.x && 
      newY < v.y + v.height && 
      newY + vehicle.height > v.y
    );
  };

  const moveVehicle = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (selectedVehicle === null) return;
    
    setVehicles(prev => prev.map(vehicle => {
      if (vehicle.id !== selectedVehicle) return vehicle;
      
      let newX = vehicle.x;
      let newY = vehicle.y;
      
      switch (direction) {
        case 'up':
          newY = Math.max(0, vehicle.y - GRID_SIZE);
          break;
        case 'down':
          newY = Math.min(GAME_HEIGHT - vehicle.height, vehicle.y + GRID_SIZE);
          break;
        case 'left':
          newX = Math.max(0, vehicle.x - GRID_SIZE);
          break;
        case 'right':
          newX = Math.min(GAME_WIDTH - vehicle.width, vehicle.x + GRID_SIZE);
          break;
      }
      
      // Check for collisions
      if (checkCollision(vehicle, newX, newY, vehicle.id)) {
        return vehicle;
      }
      
      // Check if vehicle reached edge (cleared)
      if (newX <= 0 || newX >= GAME_WIDTH - vehicle.width || newY <= 0 || newY >= GAME_HEIGHT - vehicle.height) {
        setScore(prev => prev + 100);
        setClearedVehicles(prev => prev + 1);
        return { ...vehicle, x: -1000, y: -1000 }; // Move off screen
      }
      
      return { ...vehicle, x: newX, y: newY };
    }));
  }, [selectedVehicle, vehicles]);

  // Check for level completion
  useEffect(() => {
    const visibleVehicles = vehicles.filter(v => v.x > -500 && v.y > -500);
    if (gameActive && visibleVehicles.length <= 2) {
      // Next level
      setLevel(prev => prev + 1);
      setTimeLeft(prev => prev + 15);
      setScore(prev => prev + 500);
      generateLevel(level + 1);
    }
  }, [vehicles, gameActive, level, generateLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || selectedVehicle === null) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          moveVehicle('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveVehicle('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveVehicle('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveVehicle('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, selectedVehicle, moveVehicle]);

  const handleVehicleClick = (vehicleId: number) => {
    if (!gameActive) return;
    setSelectedVehicle(selectedVehicle === vehicleId ? null : vehicleId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">🚗 Traffic Tamer</h1>
          <div className="flex gap-2">
            <div className="bg-red-100 px-3 py-1 rounded-full">
              <Timer className="w-4 h-4 inline mr-1" />
              {timeLeft}s
            </div>
            <div className="bg-blue-100 px-3 py-1 rounded-full">
              Level {level}
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{clearedVehicles}</div>
            <div className="text-sm text-gray-600">Cleared</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative mx-auto mb-4" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
          <div 
            ref={gameAreaRef}
            className="relative bg-gray-200 border-4 border-gray-400 overflow-hidden"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 pointer-events-none" width={GAME_WIDTH} height={GAME_HEIGHT}>
              {Array.from({ length: 13 }, (_, i) => (
                <g key={i}>
                  <line x1={i * GRID_SIZE} y1={0} x2={i * GRID_SIZE} y2={GAME_HEIGHT} stroke="#ccc" strokeWidth="1" />
                  <line x1={0} y1={i * GRID_SIZE} x2={GAME_WIDTH} y2={i * GRID_SIZE} stroke="#ccc" strokeWidth="1" />
                </g>
              ))}
            </svg>

            {/* Vehicles */}
            {vehicles.map(vehicle => (
              vehicle.x > -500 && vehicle.y > -500 && (
                <div
                  key={vehicle.id}
                  className={`absolute cursor-pointer transition-all duration-200 border-2 flex items-center justify-center text-white font-bold ${
                    selectedVehicle === vehicle.id ? 'border-yellow-400 shadow-lg scale-105' : 'border-gray-600'
                  }`}
                  style={{
                    left: vehicle.x,
                    top: vehicle.y,
                    width: vehicle.width,
                    height: vehicle.height,
                    backgroundColor: vehicle.color,
                  }}
                  onClick={() => handleVehicleClick(vehicle.id)}
                >
                  {vehicle.type === 'car' ? '🚗' : vehicle.type === 'rickshaw' ? '🛺' : '🚌'}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 mb-4">
          {!gameActive && !gameOver ? (
            <p>Click vehicles to select them, then use arrow keys or WASD to move them out of the intersection!</p>
          ) : selectedVehicle !== null ? (
            <p>Use arrow keys or WASD to move the selected vehicle</p>
          ) : (
            <p>Click a vehicle to select it</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!gameActive && !gameOver ? (
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          ) : gameOver ? (
            <div className="text-center">
              <div className="mb-4">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-gray-800">Traffic Cleared!</h3>
                <p className="text-gray-600">Final Score: {score}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={resetGame} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={onBack}>Back to Games</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TrafficTamer;