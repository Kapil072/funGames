import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Mail, Trash2, Star, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BubbleBlast } from "./BubbleBlast";

interface EmailInboxChaosProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Email {
  id: number;
  subject: string;
  sender: string;
  isSpam: boolean;
  isImportant: boolean;
  x: number;
  y: number;
  speed: number;
  deleted: boolean;
  kept: boolean;
}

const EmailInboxChaos = ({ onGameComplete, onBack }: EmailInboxChaosProps) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [score, setScore] = useState(0);
  const [inboxOverflow, setInboxOverflow] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextEmailId, setNextEmailId] = useState(0);
  const [blasts, setBlasts] = useState<{ x: number; y: number; id: number }[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);

  const spamSubjects = [
    "URGENT: Your account has been suspended!",
    "CONGRATULATIONS! You've won $1,000,000!",
    "Limited time offer - 90% off everything!",
    "Your computer has 47 viruses!",
    "Prince from Nigeria needs your help",
    "Enlarge your... confidence!",
    "Hot singles in your area!",
    "You're the 1,000,000th visitor!",
    "Free iPhone - just pay shipping!",
    "Your inheritance is waiting!",
    "Make money fast from home!",
    "Lose 20 pounds in 3 days!",
    "Your package delivery failed",
    "Bank account verification required",
    "Social security number compromised"
  ];

  const importantSubjects = [
    "Meeting tomorrow at 10 AM",
    "Project deadline reminder",
    "Salary increase approved",
    "Client feedback - urgent",
    "System maintenance tonight",
    "New project assignment",
    "Performance review scheduled",
    "Team lunch this Friday",
    "Code review request",
    "Deployment successful",
    "Bug fix required - high priority",
    "New feature request",
    "Database backup completed",
    "Security update available",
    "Team building event"
  ];

  const spamSenders = [
    "noreply@spam.com",
    "winner@lottery.com",
    "urgent@security.com",
    "prince@nigeria.com",
    "hot@singles.com",
    "free@iphone.com",
    "money@fast.com",
    "virus@scan.com",
    "inheritance@lawyer.com",
    "weight@loss.com"
  ];

  const importantSenders = [
    "boss@company.com",
    "hr@company.com",
    "client@important.com",
    "system@company.com",
    "team@company.com",
    "dev@company.com",
    "security@company.com",
    "admin@company.com"
  ];

  const spawnEmail = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    if (now - lastSpawnRef.current < 1500) return;
    lastSpawnRef.current = now;

    const isSpam = Math.random() < 0.7; // 70% chance of spam
    const isImportant = Math.random() < 0.3; // 30% chance of important
    
    const subjects = isSpam ? spamSubjects : importantSubjects;
    const senders = isSpam ? spamSenders : importantSenders;
    
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const sender = senders[Math.floor(Math.random() * senders.length)];
    
    const x = Math.random() * 80 + 10;
    const id = nextEmailId;
    
    const newEmail: Email = {
      id,
      subject,
      sender,
      isSpam,
      isImportant,
      x,
      y: -10,
      speed: 1.2 + Math.random() * 0.8,
      deleted: false,
      kept: false
    };

    setEmails(prev => [...prev, newEmail]);
    setNextEmailId(prev => prev + 1);

    // Remove email if it falls off screen
    setTimeout(() => {
      setEmails(prev => {
        const found = prev.find(e => e.id === id && !e.deleted && !e.kept);
        if (found) {
          if (found.isSpam) {
            setScore(prev => prev + 5); // Good - spam missed inbox
          } else {
            setInboxOverflow(prev => Math.min(100, prev + 8)); // Bad - important email missed
          }
        }
        return prev.filter(e => e.id !== id);
      });
    }, 8000);
  }, [gameActive, nextEmailId]);

  const deleteEmail = (emailId: number) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setEmails(prev =>
      prev.map(e =>
        e.id === emailId
          ? { ...e, deleted: true }
          : e
      )
    );

    if (email.isSpam) {
      setScore(prev => prev + 15);
      setInboxOverflow(prev => Math.max(0, prev - 2));
    } else {
      setScore(prev => prev - 20);
      setInboxOverflow(prev => Math.min(100, prev + 10));
    }

    setBlasts(prev => [
      ...prev,
      { x: email.x, y: email.y, id: emailId }
    ]);

    // Remove deleted email after animation
    setTimeout(() => {
      setEmails(prev => prev.filter(e => e.id !== emailId));
    }, 300);
  };

  const keepEmail = (emailId: number) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setEmails(prev =>
      prev.map(e =>
        e.id === emailId
          ? { ...e, kept: true }
          : e
      )
    );

    if (email.isSpam) {
      setScore(prev => prev - 10);
      setInboxOverflow(prev => Math.min(100, prev + 5));
    } else {
      setScore(prev => prev + 25);
      setInboxOverflow(prev => Math.max(0, prev - 3));
    }

    // Remove kept email after animation
    setTimeout(() => {
      setEmails(prev => prev.filter(e => e.id !== emailId));
    }, 300);
  };

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    spawnEmail();

    setEmails(prev => {
      const updatedEmails = prev.map(email => ({
        ...email,
        y: email.y + email.speed
      }));

      // Check for emails that hit the bottom
      const remainingEmails: Email[] = [];
      let overflowIncrease = 0;

      updatedEmails.forEach(email => {
        if (email.deleted || email.kept) {
          // Remove processed emails after animation
          setTimeout(() => {
            setEmails(current => current.filter(e => e.id !== email.id));
          }, 300);
        } else if (email.y > 90) {
          // Email hit bottom - increase overflow
          overflowIncrease += 5;
        } else {
          remainingEmails.push(email);
        }
      });

      if (overflowIncrease > 0) {
        setInboxOverflow(prev => Math.min(100, prev + overflowIncrease));
      }

      return remainingEmails;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, spawnEmail]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setInboxOverflow(0);
    setEmails([]);
    setNextEmailId(0);
    lastSpawnRef.current = 0;
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const earnedXp = Math.floor(score * 1.3) + Math.max(0, 100 - inboxOverflow);
    onGameComplete(earnedXp);
  }, [score, inboxOverflow, onGameComplete]);

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
    if (inboxOverflow >= 100) {
      endGame();
    }
  }, [inboxOverflow, endGame]);

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Inbox Chaos Over!</h2>
          <p className="text-gray-600 mb-6">
            You managed {score} points worth of email sanity!
          </p>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full bg-blue-600 hover:bg-blue-700">
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
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl max-w-4xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📧 Email Inbox Chaos</h2>
            <p className="text-sm text-gray-600">Delete spam, keep important emails!</p>
          </div>
          <Button onClick={startGame} variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-xs text-gray-600">Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{inboxOverflow}%</div>
            <div className="text-xs text-gray-600">Inbox Overflow</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{emails.length}</div>
            <div className="text-xs text-gray-600">Active Emails</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={inboxOverflow} className="h-3" />
          <div className="text-xs text-gray-500 mt-1">
            {inboxOverflow >= 80 ? "📧 INBOX OVERFLOW!" : inboxOverflow >= 60 ? "📧 Getting full..." : "📧 Manageable inbox"}
          </div>
        </div>

        {/* Game Area */}
        <div
          ref={gameAreaRef}
          className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl h-96 border-4 border-blue-200 overflow-hidden"
        >
          {/* Falling Emails */}
          {emails.map(email => (
            <div
              key={email.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                email.deleted ? 'scale-150 opacity-0' : email.kept ? 'scale-150 opacity-0' : 'hover:scale-105'
              }`}
              style={{
                left: `${email.x}%`,
                top: `${email.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border-2 max-w-xs ${
                email.isSpam ? 'border-red-300 bg-red-50' : email.isImportant ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-600 truncate">
                    {email.sender}
                  </div>
                  <div className="flex space-x-1">
                    {email.isImportant && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                    {email.isSpam && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-3 line-clamp-2">
                  {email.subject}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => keepEmail(email.id)}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Keep
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => deleteEmail(email.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

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
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-blue-300"></div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Click "Delete" for spam emails, "Keep" for important ones!</p>
          <p className="mt-1">Don't let your inbox overflow! ⭐ = Important, ⚠️ = Spam</p>
        </div>
      </div>
    </div>
  );
};

export default EmailInboxChaos; 