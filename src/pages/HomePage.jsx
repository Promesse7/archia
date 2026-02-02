import React from 'react';
import { Card, CardContent, Button } from '../components/ui';

export default function HomePage({ onNavigate, fragmentCount }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Welcome section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Welcome to ARCHIA
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Reconstruct ancient pottery fragments with AI-powered analysis and 3D visualization
          </p>
          
          {/* Fragment count indicator */}
          {fragmentCount > 0 && (
            <div className="inline-flex items-center px-4 py-2 bg-amber-500/20 border border-amber-500 rounded-full">
              <span className="text-amber-500 font-medium">
                {fragmentCount} fragment{fragmentCount !== 1 ? 's' : ''} captured
              </span>
            </div>
          )}
        </div>

        {/* Primary action cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="group hover:border-amber-500 transition-all duration-300 cursor-pointer">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl">📸</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Capture Fragment
                </h3>
                <p className="text-zinc-400 mb-6">
                  Photograph or upload pottery fragments for AI analysis
                </p>
              </div>
              <Button 
                onClick={() => onNavigate('capture')}
                className="w-full"
                size="lg"
              >
                Start Capture
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:border-amber-500 transition-all duration-300 cursor-pointer">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl">🏺</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  View Reconstruction
                </h3>
                <p className="text-zinc-400 mb-6">
                  Assemble fragments into complete 3D pottery models
                </p>
              </div>
              <Button 
                onClick={() => onNavigate('reconstruction')}
                className="w-full"
                size="lg"
                variant={fragmentCount === 0 ? "outline" : "default"}
                disabled={fragmentCount === 0}
              >
                {fragmentCount === 0 ? 'Need Fragments' : 'View 3D Model'}
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:border-amber-500 transition-all duration-300 cursor-pointer">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl">🧩</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Puzzle Lab
                </h3>
                <p className="text-zinc-400 mb-6">
                  Train your eye with archaeological fragment puzzles
                </p>
              </div>
              <Button 
                onClick={() => onNavigate('puzzle')}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Enter Lab
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-amber-500">
              {fragmentCount}
            </div>
            <div className="text-zinc-500 text-sm">
              Fragments Captured
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-amber-500">
              {fragmentCount > 0 ? '1' : '0'}
            </div>
            <div className="text-zinc-500 text-sm">
              Sessions Active
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-amber-500">
              AI Ready
            </div>
            <div className="text-zinc-500 text-sm">
              System Status
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
