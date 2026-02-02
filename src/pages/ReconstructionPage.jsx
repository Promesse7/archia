import React, { useState } from 'react';
import EnhancedReconstructionViewer from '../components/EnhancedReconstructionViewer';
import { Card, CardHeader, CardTitle, CardContent, Button, SectionHeader } from '../components/ui';
import { getPotteryReconstructor } from '../reconstruction/potteryRebuilder';

export default function ReconstructionPage({ onNavigate, fragments }) {
  const [reconstructedMesh, setReconstructedMesh] = useState(null);

  // Auto-reconstruct when fragments are available
  React.useEffect(() => {
    if (hasFragments && fragments.length > 0) {
      console.log("Auto-reconstructing with fragments:", fragments.length);
      reconstructPottery(fragments);
    }
  }, [fragments]);

  const reconstructPottery = (fragmentsList) => {
    try {
      console.log("Starting reconstruction with fragments:", fragmentsList.length);
      
      const reconstructor = getPotteryReconstructor();
      reconstructor.clear();

      fragmentsList.forEach((fragment, index) => {
        if (fragment.pointCloud && fragment.pointCloud.length > 0) {
          console.log(`Adding fragment ${index}: ${fragment.pointCloud.length} points, type: ${fragment.classification?.fragmentType}`);
          reconstructor.addFragment(fragment.pointCloud, {
            fragmentType: fragment.classification?.fragmentType,
            confidence: fragment.classification?.confidence,
          });
        } else {
          console.warn(`Fragment ${index} has no point cloud data`);
        }
      });

      const mesh = reconstructor.reconstruct();
      console.log("Reconstruction complete, mesh:", mesh);
      
      setReconstructedMesh(mesh);

      console.log("Reconstruction complete:", reconstructor.getStats());
    } catch (err) {
      console.error("Reconstruction error:", err);
    }
  };

  const clearSession = () => {
    setReconstructedMesh(null);
    getPotteryReconstructor().clear();
  };

  const hasFragments = fragments && fragments.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            3D Reconstruction
          </h1>
          <p className="text-zinc-400 text-lg">
            Assemble fragments into complete pottery models
          </p>
        </div>

        {/* Empty state */}
        {!hasFragments && (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="text-6xl mb-4">🏺</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Fragments Yet
              </h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Capture pottery fragments first to reconstruct them into 3D models
              </p>
              <Button
                onClick={() => onNavigate('capture')}
                size="lg"
              >
                Capture Fragments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reconstruction viewer */}
        {hasFragments && (
          <Card>
            <CardHeader>
              <SectionHeader
                title="Fragment Assembly"
                description={`Reconstructing from ${fragments.length} fragment${fragments.length !== 1 ? 's' : ''}`}
                actions={
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => reconstructPottery(fragments)}
                      variant="outline"
                      size="sm"
                    >
                      Rebuild
                    </Button>
                    <Button
                      onClick={clearSession}
                      variant="destructive"
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                }
              />
            </CardHeader>
            <CardContent>
              <div className="h-[600px] rounded-lg bg-zinc-950">
                <EnhancedReconstructionViewer
                  mesh={reconstructedMesh}
                  classification={fragments[fragments.length - 1]?.classification || null}
                  showPointCloud={false}
                  showMesh={true}
                  autoRotate={true}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fragment gallery */}
        {hasFragments && (
          <Card>
            <CardHeader>
              <CardTitle>
                Captured Fragments ({fragments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {fragments.map((fragment, index) => (
                  <div
                    key={fragment.timestamp}
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

        {/* Navigation hint */}
        <div className="text-center space-x-4">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
          >
            ← Back to Home
          </Button>
          {hasFragments && (
            <Button
              onClick={() => onNavigate('capture')}
              variant="outline"
            >
              Capture More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
