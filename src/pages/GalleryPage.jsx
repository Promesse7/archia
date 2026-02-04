import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';

export default function GalleryPage({ onNavigate, fragments = [] }) {
  const hasFragments = fragments && fragments.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Fragment Gallery</h1>
          <p className="text-zinc-400 text-lg">Browse captured fragments and review classifications</p>
        </div>

        {!hasFragments && (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="text-6xl mb-4">🗂️</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Fragments Yet</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Capture pottery fragments first to populate your gallery.
              </p>
              <Button onClick={() => onNavigate('capture')} size="lg">
                Capture Fragments
              </Button>
            </CardContent>
          </Card>
        )}

        {hasFragments && (
          <Card>
            <CardHeader>
              <CardTitle>Captured Fragments ({fragments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {fragments.map((fragment, index) => (
                  <div
                    key={fragment.timestamp ?? index}
                    className="border-2 border-zinc-700 rounded-lg overflow-hidden hover:border-amber-500 transition-colors"
                  >
                    <img
                      src={fragment.image}
                      alt={`Fragment ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2 bg-zinc-800 text-center text-xs">
                      <div className="text-amber-500 font-medium">
                        {fragment.classification?.fragmentType || "?"}
                      </div>
                      <div className="text-zinc-500">
                        {((fragment.classification?.confidence || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button onClick={() => onNavigate('home')} variant="ghost">
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
