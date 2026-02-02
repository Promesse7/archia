import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Page header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            About ARCHIA
          </h1>
          <p className="text-zinc-400 text-lg">
            AI-Powered Archaeological Reconstruction
          </p>
        </div>

        {/* Project overview */}
        <Card>
          <CardHeader>
            <CardTitle>The Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              ARCHIA represents a breakthrough in archaeological preservation, combining 
              cutting-edge artificial intelligence with traditional archaeological methods 
              to reconstruct ancient pottery from fragmentary evidence.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Our system uses advanced computer vision, depth estimation, and 3D reconstruction 
              algorithms to analyze pottery fragments and predict their original form, helping 
              archaeologists and researchers piece together the past with unprecedented accuracy.
            </p>
          </CardContent>
        </Card>

        {/* Technology */}
        <Card>
          <CardHeader>
            <CardTitle>Technology & Methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-amber-500">AI Analysis</h4>
                <ul className="space-y-2 text-zinc-400">
                  <li>• Deep learning fragment classification</li>
                  <li>• MiDaS depth estimation for 3D mapping</li>
                  <li>• Pattern recognition and shape prediction</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-amber-500">3D Reconstruction</h4>
                <ul className="space-y-2 text-zinc-400">
                  <li>• Point cloud generation from 2D images</li>
                  <li>• Symmetry-based pottery modeling</li>
                  <li>• Interactive visualization and analysis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research context */}
        <Card>
          <CardHeader>
            <CardTitle>Research & Collaboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              This project builds on research from the Unearthed series and collaboration 
              with archaeological institutions worldwide. Our methodology has been validated 
              through extensive testing with real archaeological collections.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              The system is designed to augment, not replace, traditional archaeological expertise. 
              By providing AI-assisted reconstruction, we enable researchers to work more efficiently 
              and explore hypotheses that would be time-consuming to test manually.
            </p>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">🏛️</div>
                <h4 className="font-semibold text-white">Museums</h4>
                <p className="text-zinc-400 text-sm">
                  Digital restoration and exhibit preparation
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="text-4xl">🎓</div>
                <h4 className="font-semibold text-white">Education</h4>
                <p className="text-zinc-400 text-sm">
                  Teaching archaeological methods and analysis
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="text-4xl">🔬</div>
                <h4 className="font-semibold text-white">Research</h4>
                <p className="text-zinc-400 text-sm">
                  Accelerating fragment analysis and reconstruction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future development */}
        <Card>
          <CardHeader>
            <CardTitle>Future Development</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              We're continuously improving ARCHIA with new features and capabilities. 
              Future developments include expanded pottery type recognition, collaborative 
              reconstruction tools, and integration with museum databases.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h5 className="font-semibold text-amber-500 mb-2">Short Term</h5>
                <ul className="text-zinc-400 text-sm space-y-1">
                  <li>• Enhanced fragment classification</li>
                  <li>• Batch processing capabilities</li>
                  <li>• Export to standard 3D formats</li>
                </ul>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h5 className="font-semibold text-amber-500 mb-2">Long Term</h5>
                <ul className="text-zinc-400 text-sm space-y-1">
                  <li>• Multi-fragment assembly</li>
                  <li>• Historical pattern database</li>
                  <li>• AR/VR visualization tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation hint */}
        <div className="text-center">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
