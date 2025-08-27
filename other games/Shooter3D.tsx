import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, PerspectiveCamera } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

interface Target {
  id: number;
  position: Vector3;
  speed: number;
  color: string;
  points: number;
}

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

const Gun = ({ isShooting }: { isShooting: boolean }) => {
  const gunRef = useRef<any>();
  
  useFrame((state) => {
    if (gunRef.current) {
      if (isShooting) {
        gunRef.current.rotation.x = -0.15;
        gunRef.current.position.z = 0.1;
      } else {
        gunRef.current.rotation.x = -0.05;
        gunRef.current.position.z = 0;
      }
    }
  });

  return (
    <group ref={gunRef} position={[0.4, -0.4, -0.6]}>
      {/* Gun barrel */}
      <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.8, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Gun body */}
      <mesh position={[0, -0.08, 0.1]}>
        <boxGeometry args={[0.1, 0.2, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Gun grip */}
      <mesh position={[0, -0.15, -0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* Trigger guard */}
      <mesh position={[0, -0.12, 0.05]}>
        <torusGeometry args={[0.04, 0.008, 8, 16]} />
        <meshStandardMaterial color="#555" metalness={0.7} />
      </mesh>
      {/* Muzzle flash when shooting */}
      {isShooting && (
        <>
          <mesh position={[0, 0, 0.8]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.85]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
};

const MovingTarget = ({ target, onHit }: { target: Target; onHit: (id: number, points: number) => void }) => {
  const targetRef = useRef<any>();
  
  useFrame(() => {
    if (targetRef.current) {
      targetRef.current.position.z += target.speed;
      
      // Remove target if it goes past the player
      if (targetRef.current.position.z > 2) {
        targetRef.current.position.z = -20;
        targetRef.current.position.x = (Math.random() - 0.5) * 10;
        targetRef.current.position.y = (Math.random() - 0.5) * 5;
      }
    }
  });

  const handleClick = () => {
    onHit(target.id, target.points);
  };

  return (
    <mesh
      ref={targetRef}
      position={[target.position.x, target.position.y, target.position.z]}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={target.color} />
      <Text
        position={[0, 0, 0.31]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {target.points}
      </Text>
    </mesh>
  );
};

const GameScene = ({ 
  targets, 
  onTargetHit, 
  isShooting 
}: { 
  targets: Target[]; 
  onTargetHit: (id: number, points: number) => void;
  isShooting: boolean;
}) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />

      {/* Environment - Black floor */}
      <mesh position={[0, -2, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Sky */}
      <mesh position={[0, 10, -25]}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial color="#87CEEB" side={2} />
      </mesh>

      {/* Gun */}
      <Gun isShooting={isShooting} />

      {/* Targets */}
      {targets.map((target) => (
        <MovingTarget key={target.id} target={target} onHit={onTargetHit} />
      ))}

      {/* Small black dot crosshair */}
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[0.005, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </>
  );
};

const Shooter3D = ({ onGameComplete, onBack }: GameProps) => {
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(30);
  const [targets, setTargets] = useState<Target[]>([]);
  const [nextTargetId, setNextTargetId] = useState(1);
  const [isShooting, setIsShooting] = useState(false);
  const [wave, setWave] = useState(1);

  const spawnTarget = useCallback(() => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const newTarget: Target = {
      id: nextTargetId,
      position: new Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        -20
      ),
      speed: 0.05 + wave * 0.01,
      color: colors[Math.floor(Math.random() * colors.length)],
      points: Math.floor(Math.random() * 20) + 10
    };
    
    setTargets(prev => [...prev, newTarget]);
    setNextTargetId(prev => prev + 1);
  }, [nextTargetId, wave]);

  useEffect(() => {
    const interval = setInterval(spawnTarget, 2000 - wave * 100);
    return () => clearInterval(interval);
  }, [spawnTarget, wave]);

  useEffect(() => {
    if (score > 0 && score % 500 === 0) {
      setWave(prev => prev + 1);
      toast.success(`Wave ${wave + 1}! Difficulty increased!`);
    }
  }, [score, wave]);

  const handleTargetHit = (targetId: number, points: number) => {
    setTargets(prev => prev.filter(t => t.id !== targetId));
    setScore(prev => prev + points);
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 100);
    
    // Shooting sound effect simulation
    toast.success(`+${points} points!`, { duration: 1000 });
  };

  const handleShoot = useCallback((event: React.MouseEvent) => {
    if (ammo <= 0 || gameState !== 'playing') return;
    
    setAmmo(prev => prev - 1);
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 100);

    if (ammo === 1) {
      setTimeout(() => {
        setGameState('gameOver');
        onGameComplete(score);
        toast.success(`Game Over! Final Score: ${score}`);
      }, 100);
    }
  }, [ammo, gameState, score, onGameComplete]);

  const resetGame = () => {
    setGameState('playing');
    setScore(0);
    setAmmo(30);
    setTargets([]);
    setWave(1);
    setNextTargetId(1);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-400 to-green-400 relative">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button variant="outline" onClick={onBack} className="bg-white/20 text-white border-white/30">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-10 space-y-2 text-white">
        <div className="bg-black/50 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" />
            <span>Score: {score}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span>🔫</span>
            <span>Ammo: {ammo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌊</span>
            <span>Wave: {wave}</span>
          </div>
        </div>
      </div>

      {/* Small black dot crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="w-1 h-1 bg-black rounded-full"></div>
      </div>

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl text-center max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Mission Complete!</h2>
            <p className="text-xl text-gray-600 mb-4">Final Score: {score}</p>
            <p className="text-lg text-gray-600 mb-6">Wave Reached: {wave}</p>
            <div className="space-y-4">
              <Button onClick={resetGame} className="w-full">
                Play Again
              </Button>
              <Button variant="outline" onClick={onBack} className="w-full">
                Back to Games
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
          <p className="text-sm">Click on targets to shoot them! 🎯</p>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        className="w-full h-full cursor-crosshair"
        onClick={handleShoot}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
        <GameScene 
          targets={targets} 
          onTargetHit={handleTargetHit}
          isShooting={isShooting}
        />
      </Canvas>
    </div>
  );
};

export default Shooter3D;