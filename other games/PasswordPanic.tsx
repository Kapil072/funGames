import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Eye, EyeOff } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface PasswordChallenge {
  id: number;
  requirements: string[];
  currentPassword: string;
  isValid: boolean;
  timeLeft: number;
}

const PasswordPanic = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentChallenge, setCurrentChallenge] = useState<PasswordChallenge | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [completedPasswords, setCompletedPasswords] = useState(0);
  const [frustrationLevel, setFrustrationLevel] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const challengeTimerRef = useRef<NodeJS.Timeout>();

  const passwordRequirements = [
    "At least 8 characters",
    "At least 15 characters",
    "Contains uppercase letter",
    "Contains lowercase letter", 
    "Contains number",
    "Contains special character (!@#$%^&*)",
    "No consecutive characters",
    "No common words (password, admin, user)",
    "Contains exclamation mark (!)",
    "Contains at symbol (@)",
    "Contains dollar sign ($)",
    "Contains percent sign (%)",
    "Contains caret (^)",
    "Contains ampersand (&)",
    "Contains asterisk (*)",
    "Contains plus sign (+)",
    "Contains minus sign (-)",
    "Contains equals sign (=)",
    "Contains underscore (_)",
    "Contains pipe symbol (|)",
    "Contains backslash (\\)",
    "Contains forward slash (/)",
    "Contains question mark (?)",
    "Contains period (.)",
    "Contains comma (,)",
    "Contains semicolon (;)",
    "Contains colon (:)",
    "Contains quotation marks (\")",
    "Contains apostrophe (')",
    "Contains tilde (~)",
    "Contains backtick (`)",
    "Contains square brackets ([])",
    "Contains curly braces ({})",
    "Contains parentheses (())",
    "Contains less than (<)",
    "Contains greater than (>)",
    "No keyboard patterns (qwerty, 12345)"
  ];

  const generateChallenge = useCallback((levelNum: number) => {
    // Always include the core requirements more frequently
    const coreRequirements = [
      "Contains uppercase letter",
      "Contains lowercase letter", 
      "Contains number",
      "At least 15 characters"
    ];
    
    // Select 2-3 core requirements randomly
    const selectedCore = coreRequirements
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);
    
    // Select additional requirements from the full list
    const additionalRequirements = passwordRequirements
      .filter(req => !coreRequirements.includes(req))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(levelNum, 3));
    
    const allRequirements = [...selectedCore, ...additionalRequirements];
    
    const challenge: PasswordChallenge = {
      id: Date.now(),
      requirements: allRequirements,
      currentPassword: "",
      isValid: false,
      timeLeft: Math.max(20 - levelNum, 10)
    };
    
    setCurrentChallenge(challenge);
    setInputPassword("");
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setCompletedPasswords(0);
    setFrustrationLevel(0);
    generateChallenge(1);
  }, [generateChallenge]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setCurrentChallenge(null);
    setInputPassword("");
    setCompletedPasswords(0);
    setFrustrationLevel(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
  }, []);

  // Challenge timer
  useEffect(() => {
    if (gameActive && !gameOver && currentChallenge) {
      challengeTimerRef.current = setInterval(() => {
        setCurrentChallenge(prev => {
          if (!prev) return null;
          
          if (prev.timeLeft <= 1) {
            setFrustrationLevel(prev => Math.min(100, prev + 20));
            if (frustrationLevel >= 80) {
              setGameOver(true);
              setGameActive(false);
              const finalXP = score * 8;
              onGameComplete(finalXP);
              return null;
            }
            // Generate new challenge
            setTimeout(() => generateChallenge(level), 100);
            return null;
          }
          
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    
    return () => {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    };
  }, [gameActive, gameOver, currentChallenge, level, generateChallenge, frustrationLevel, score, onGameComplete]);

  const checkPasswordRequirements = (password: string, requirements: string[]) => {
    const checks = {
      "At least 8 characters": password.length >= 8,
      "At least 12 characters": password.length >= 12,
      "At least 15 characters": password.length >= 15,
      "Contains uppercase letter": /[A-Z]/.test(password),
      "Contains lowercase letter": /[a-z]/.test(password),
      "Contains number": /\d/.test(password),
      "Contains special character (!@#$%^&*)": /[!@#$%^&*]/.test(password),
      "No consecutive characters": !/(.)\1{2,}/.test(password),
      "No common words (password, admin, user)": !/(password|admin|user)/i.test(password),
      "Contains exclamation mark (!)": /!/.test(password),
      "Contains at symbol (@)": /@/.test(password),
      "Contains dollar sign ($)": /\$/.test(password),
      "Contains percent sign (%)": /%/.test(password),
      "Contains caret (^)": /\^/.test(password),
      "Contains ampersand (&)": /&/.test(password),
      "Contains asterisk (*)": /\*/.test(password),
      "Contains plus sign (+)": /\+/.test(password),
      "Contains minus sign (-)": /-/.test(password),
      "Contains equals sign (=)": /=/.test(password),
      "Contains underscore (_)": /_/.test(password),
      "Contains pipe symbol (|)": /\|/.test(password),
      "Contains backslash (\\)": /\\/.test(password),
      "Contains forward slash (/)": /\//.test(password),
      "Contains question mark (?)": /\?/.test(password),
      "Contains period (.)": /\./.test(password),
      "Contains comma (,)": /,/.test(password),
      "Contains semicolon (;)": /;/.test(password),
      "Contains colon (:)": /:/.test(password),
      "Contains quotation marks (\")": /["']/.test(password),
      "Contains apostrophe (')": /'/.test(password),
      "Contains tilde (~)": /~/.test(password),
      "Contains backtick (`)": /`/.test(password),
      "Contains square brackets ([])": /[[\]]/.test(password),
      "Contains curly braces ({})": /[{}]/.test(password),
      "Contains parentheses (())": /[()]/.test(password),
      "Contains less than (<)": /</.test(password),
      "Contains greater than (>)": />/.test(password),
      "No keyboard patterns (qwerty, 12345)": !/(qwerty|12345|abcde)/i.test(password)
    };
    
    return requirements.every(req => checks[req as keyof typeof checks]);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setInputPassword(newPassword);
    
    if (currentChallenge) {
      const isValid = checkPasswordRequirements(newPassword, currentChallenge.requirements);
      setCurrentChallenge(prev => prev ? { ...prev, isValid } : null);
      
      if (isValid) {
        // Password completed!
        setScore(prev => prev + 100 + (currentChallenge.timeLeft * 5));
        setCompletedPasswords(prev => prev + 1);
        setFrustrationLevel(prev => Math.max(0, prev - 10));
        
        if (completedPasswords + 1 >= level * 3) {
          setLevel(prev => prev + 1);
        }
        
        setTimeout(() => generateChallenge(level), 1000);
      }
    }
  };

  const getRequirementStatus = (requirement: string) => {
    if (!inputPassword) return false;
    return checkPasswordRequirements(inputPassword, [requirement]);
  };

  const getFrustrationColor = () => {
    if (frustrationLevel < 25) return "bg-green-500";
    if (frustrationLevel < 50) return "bg-yellow-500";
    if (frustrationLevel < 75) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-800">🔐 Password Panic</h1>
          <div className="bg-red-100 px-2 py-1 rounded-full text-sm">
            L{level}
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completedPasswords}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>

        {/* Frustration Meter */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Frustration Level</span>
            <span>{frustrationLevel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getFrustrationColor()}`}
              style={{ width: `${frustrationLevel}%` }}
            />
          </div>
        </div>

        {/* Current Challenge */}
        {currentChallenge && gameActive ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Password Requirements</h3>
              <div className={`px-2 py-1 rounded text-sm font-bold ${
                currentChallenge.timeLeft <= 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {currentChallenge.timeLeft}s
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {currentChallenge.requirements.map((req, index) => (
                <div key={index} className={`flex items-center gap-2 text-sm ${
                  getRequirementStatus(req) ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span>{getRequirementStatus(req) ? '✅' : '❌'}</span>
                  <span>{req}</span>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={inputPassword}
                onChange={handlePasswordChange}
                placeholder="Create your password..."
                className={`w-full p-3 border-2 rounded-lg pr-10 ${
                  currentChallenge.isValid ? 'border-green-500 bg-green-50' : 'border-red-300'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {currentChallenge.isValid && (
              <div className="mt-2 text-green-600 text-sm font-semibold">
                ✨ Password accepted! Generating next challenge...
              </div>
            )}
          </div>
        ) : null}

        {/* Controls */}
        <div className="text-center">
          {!gameActive && !gameOver ? (
            <div>
              <p className="text-gray-600 mb-4 text-sm">
                Every website has different password requirements! Create passwords that meet the crazy demands before time runs out and your frustration peaks!
              </p>
              <Button onClick={startGame} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3">
                <Play className="w-4 h-4 mr-2" />
                Start Creating!
              </Button>
            </div>
          ) : gameOver ? (
            <div>
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Password Rage Quit!</h3>
              <p className="text-gray-600 mb-4">Passwords Completed: {completedPasswords}</p>
              <p className="text-gray-600 mb-4">Final Score: {score}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetGame} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
                <Button onClick={onBack} size="sm">Back to Games</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PasswordPanic;