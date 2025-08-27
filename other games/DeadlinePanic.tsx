import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Timer, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeRequired: number;
  isCompleted: boolean;
  isDistraction: boolean;
}

interface Distraction {
  id: number;
  title: string;
  description: string;
  type: 'social' | 'entertainment' | 'procrastination';
  timeWasted: number;
}

const DeadlinePanic = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [distractionsAvoided, setDistractionsAvoided] = useState(0);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const distractionTimerRef = useRef<NodeJS.Timeout>();
  
  const realTasks = [
    { title: "Finish quarterly report", description: "Complete the Q4 financial analysis", priority: 'high' as const, timeRequired: 15 },
    { title: "Review code changes", description: "Check pull requests for bugs", priority: 'high' as const, timeRequired: 10 },
    { title: "Client meeting prep", description: "Prepare presentation slides", priority: 'medium' as const, timeRequired: 8 },
    { title: "Update documentation", description: "Fix outdated API docs", priority: 'medium' as const, timeRequired: 12 },
    { title: "Team standup", description: "Daily status update meeting", priority: 'low' as const, timeRequired: 5 },
    { title: "Bug fixes", description: "Fix critical production issues", priority: 'high' as const, timeRequired: 20 },
    { title: "Code review", description: "Review teammate's changes", priority: 'medium' as const, timeRequired: 7 },
    { title: "Database optimization", description: "Improve query performance", priority: 'low' as const, timeRequired: 18 }
  ];

  const distractionTasks = [
    { title: "Check social media", description: "See what's trending", type: 'social' as const, timeWasted: 5 },
    { title: "Watch cat videos", description: "Just one more video...", type: 'entertainment' as const, timeWasted: 8 },
    { title: "Organize desk", description: "Clean up workspace", type: 'procrastination' as const, timeWasted: 10 },
    { title: "Coffee break", description: "Get another cup", type: 'procrastination' as const, timeWasted: 3 },
    { title: "Check emails", description: "Read non-urgent messages", type: 'social' as const, timeWasted: 6 },
    { title: "Online shopping", description: "Browse for deals", type: 'entertainment' as const, timeWasted: 12 }
  ];

  const generateTasks = useCallback(() => {
    const shuffledTasks = [...realTasks].sort(() => Math.random() - 0.5);
    const shuffledDistractions = [...distractionTasks].sort(() => Math.random() - 0.5);
    
    const gameTasks: Task[] = shuffledTasks.slice(0, 6).map((task, index) => ({
      ...task,
      id: index,
      isCompleted: false,
      isDistraction: false
    }));

    const gameDistractions: Distraction[] = shuffledDistractions.slice(0, 4).map((distraction, index) => ({
      ...distraction,
      id: index
    }));

    setTasks(gameTasks);
    setDistractions(gameDistractions);
    setCurrentTask(gameTasks[0]);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(120);
    setCompletedTasks(0);
    setDistractionsAvoided(0);
    generateTasks();
  }, [generateTasks]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setTimeLeft(120);
    setCompletedTasks(0);
    setDistractionsAvoided(0);
    setTasks([]);
    setDistractions([]);
    setCurrentTask(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (distractionTimerRef.current) clearInterval(distractionTimerRef.current);
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameActive(false);
            const finalXP = score * 10 + completedTasks * 50 + distractionsAvoided * 20;
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
  }, [gameActive, gameOver, score, completedTasks, distractionsAvoided, onGameComplete]);

  // Distraction spawning
  useEffect(() => {
    if (gameActive && !gameOver) {
      distractionTimerRef.current = setInterval(() => {
        const availableDistractions = distractions.filter(d => !d.isCompleted);
        if (availableDistractions.length > 0) {
          const randomDistraction = availableDistractions[Math.floor(Math.random() * availableDistractions.length)];
          // Show distraction notification
          setDistractions(prev => prev.map(d => 
            d.id === randomDistraction.id ? { ...d, isActive: true } : d
          ));
        }
      }, 8000);
    }
    
    return () => {
      if (distractionTimerRef.current) clearInterval(distractionTimerRef.current);
    };
  }, [gameActive, gameOver, distractions]);

  const completeTask = useCallback((taskId: number) => {
    if (!gameActive || gameOver) return;

    setTasks(prev => {
      const updatedTasks = prev.map(task => 
        task.id === taskId ? { ...task, isCompleted: true } : task
      );
      
      const task = prev.find(t => t.id === taskId);
      if (task) {
        setScore(prev => prev + (task.priority === 'high' ? 100 : task.priority === 'medium' ? 75 : 50));
        setCompletedTasks(prev => prev + 1);
        setTimeLeft(prev => prev + task.timeRequired);
      }

      // Set next uncompleted task as current
      const nextTask = updatedTasks.find(t => !t.isCompleted);
      setCurrentTask(nextTask || null);

      return updatedTasks;
    });
  }, [gameActive, gameOver]);

  const handleDistraction = useCallback((distractionId: number, accepted: boolean) => {
    if (!gameActive || gameOver) return;

    const distraction = distractions.find(d => d.id === distractionId);
    if (!distraction) return;

    if (accepted) {
      // Player gave in to distraction
      setTimeLeft(prev => prev - distraction.timeWasted);
      setScore(prev => prev - 25);
    } else {
      // Player avoided distraction
      setDistractionsAvoided(prev => prev + 1);
      setScore(prev => prev + 30);
    }

    setDistractions(prev => prev.map(d => 
      d.id === distractionId ? { ...d, isActive: false } : d
    ));
  }, [gameActive, gameOver, distractions]);

  // Check for game completion
  useEffect(() => {
    if (gameActive && tasks.length > 0 && tasks.every(task => task.isCompleted)) {
      setGameOver(true);
      setGameActive(false);
      const finalXP = score * 10 + completedTasks * 50 + distractionsAvoided * 20 + 500; // Bonus for completion
      onGameComplete(finalXP);
    }
  }, [tasks, gameActive, score, completedTasks, distractionsAvoided, onGameComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || gameOver) return;
      
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (currentTask) {
          completeTask(currentTask.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, gameOver, currentTask, completeTask]);

  if (!gameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Deadline Panic</h1>
          <p className="text-gray-300 mb-8">
            Complete tasks before time runs out! Avoid distractions and manage your priorities.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={startGame}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={onBack}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Deadline Panic</h1>
            <div className="flex items-center justify-center space-x-6 text-white">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-red-400" />
                <span className="font-bold">{timeLeft}s</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-bold">{completedTasks}/{tasks.length}</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={resetGame}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Task */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Current Task</h2>
              {currentTask ? (
                <div className="space-y-4">
                  <div className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    ${currentTask.priority === 'high' 
                      ? 'border-red-500 bg-red-500/20' 
                      : currentTask.priority === 'medium' 
                        ? 'border-yellow-500 bg-yellow-500/20' 
                        : 'border-green-500 bg-green-500/20'
                    }
                  `}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">{currentTask.title}</h3>
                      <span className={`
                        px-2 py-1 rounded text-xs font-bold
                        ${currentTask.priority === 'high' 
                          ? 'bg-red-500 text-white' 
                          : currentTask.priority === 'medium' 
                            ? 'bg-yellow-500 text-black' 
                            : 'bg-green-500 text-white'
                        }
                      `}>
                        {currentTask.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{currentTask.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Time: {currentTask.timeRequired}s</span>
                      <Button 
                        onClick={() => completeTask(currentTask.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Press SPACE or click Complete to finish the task!
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-300">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>All tasks completed!</p>
                </div>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Task List</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`
                      p-3 rounded-lg border transition-all duration-200
                      ${task.isCompleted 
                        ? 'border-green-500 bg-green-500/20 opacity-60' 
                        : task.id === currentTask?.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-white/20 bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium">{task.title}</h4>
                          <span className={`
                            px-2 py-1 rounded text-xs font-bold
                            ${task.priority === 'high' 
                              ? 'bg-red-500 text-white' 
                              : task.priority === 'medium' 
                                ? 'bg-yellow-500 text-black' 
                                : 'bg-green-500 text-white'
                            }
                          `}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{task.description}</p>
                      </div>
                      {task.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Distraction Notifications */}
        {distractions.filter(d => d.isActive).map((distraction) => (
          <div key={distraction.id} className="fixed top-4 right-4 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-yellow-500/50 max-w-sm">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-white font-bold">{distraction.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{distraction.description}</p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleDistraction(distraction.id, true)}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Give In (-{distraction.timeWasted}s)
                  </Button>
                  <Button 
                    onClick={() => handleDistraction(distraction.id, false)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Resist (+30pts)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
              <div className="space-y-4 text-white">
                <p>Final Score: <span className="font-bold text-yellow-400">{score}</span></p>
                <p>Tasks Completed: <span className="font-bold text-green-400">{completedTasks}/{tasks.length}</span></p>
                <p>Distractions Avoided: <span className="font-bold text-blue-400">{distractionsAvoided}</span></p>
                <p>XP Earned: <span className="font-bold text-purple-400">{score * 10 + completedTasks * 50 + distractionsAvoided * 20}</span></p>
              </div>
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
                >
                  Play Again
                </Button>
                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Back to Games
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlinePanic; 