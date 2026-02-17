// Mock archaeological discussion data
export const mockThreads = [
  {
    id: 1,
    title: "Rim curvature suggests 12th century amphora typology",
    category: "Reconstruction Debate",
    status: "Under Review",
    tags: ["Rim", "Cultural Origin", "Medieval"],
    artifactId: "fragment_001",
    messages: [
      {
        id: 1,
        user: "Dr. Elena Kamanzi",
        role: "Archaeologist",
        verified: true,
        reputation: 847,
        publications: 23,
        content: "The curvature profile and rim thickness distribution strongly aligns with 12th century Mediterranean amphorae production techniques. The stress fracture patterns indicate firing temperatures around 850°C, consistent with coastal kilns of that period.",
        timestamp: "2 hours ago",
        confidence: 92,
        meshReferences: ["rim_fracture_01", "curvature_profile_03"]
      },
      {
        id: 2,
        user: "AI Analysis System",
        role: "AI",
        verified: false,
        content: "Structural analysis indicates 87% probability of late medieval typology. Key indicators: rim angle (23°), wall thickness gradient (0.8mm to 2.3mm), and mineral composition matching southern Italian clay deposits.",
        timestamp: "1 hour ago",
        confidence: 87,
        meshReferences: ["rim_angle_01", "thickness_gradient_02"]
      },
      {
        id: 3,
        user: "Aline Dubois",
        role: "Public",
        verified: false,
        content: "Could post-depositional erosion have affected the rim curvature? The fracture lines seem to follow natural cleavage planes rather than impact patterns.",
        timestamp: "1 hour ago",
        confidence: 0,
        meshReferences: ["erosion_patterns_01"]
      },
      {
        id: 4,
        user: "Prof. Marcus Chen",
        role: "Archaeologist",
        verified: true,
        reputation: 1203,
        publications: 41,
        content: "Excellent point about erosion, Aline. However, the micro-strain patterns visible under UV analysis suggest the rim fracture occurred during initial cooling, not post-depositional. The curvature is indeed original.",
        timestamp: "45 minutes ago",
        confidence: 95,
        meshReferences: ["micro_strain_01"]
      }
    ],
    aiSummary: {
      mainTopic: "Rim curvature typology and era classification",
      keyDebates: ["Erosion vs original fracture", "Manufacturing technique", "Cultural origin"],
      confidenceDivergence: 12,
      expertConsensus: "Late medieval Mediterranean amphora",
      openQuestions: ["Specific kiln location", "Trade route implications"]
    }
  },
  {
    id: 2,
    title: "Structural integrity concerns for reconstruction",
    category: "Structural Integrity",
    status: "Open",
    tags: ["Base", "Structural", "Reconstruction"],
    artifactId: "fragment_002",
    messages: [
      {
        id: 5,
        user: "Dr. Sarah Mitchell",
        role: "Archaeologist",
        verified: true,
        reputation: 623,
        publications: 15,
        content: "The base fragment shows significant internal stress concentrations. Current reconstruction may not account for the original wall thickness variation. I recommend adjusting the reconstruction algorithm.",
        timestamp: "4 hours ago",
        confidence: 88,
        meshReferences: ["base_stress_01", "wall_thickness_02"]
      },
      {
        id: 6,
        user: "AI Analysis System",
        role: "AI",
        verified: false,
        content: "Finite element analysis identifies 3 critical stress points. Suggested reinforcement: increase wall thickness at base junction by 15%, adjust firing curve simulation parameters.",
        timestamp: "3 hours ago",
        confidence: 91,
        meshReferences: ["stress_points_01", "reinforcement_zones_02"]
      }
    ],
    aiSummary: {
      mainTopic: "Structural integrity and reconstruction accuracy",
      keyDebates: ["Wall thickness variation", "Stress concentration points", "Reconstruction algorithm adjustments"],
      confidenceDivergence: 8,
      expertConsensus: "Reconstruction requires modification",
      openQuestions: ["Optimal reinforcement strategy", "Historical accuracy vs structural stability"]
    }
  },
  {
    id: 3,
    title: "Cultural context: Trade route implications",
    category: "Historical Context",
    status: "Resolved",
    tags: ["Cultural Origin", "Trade", "Historical"],
    artifactId: "fragment_003",
    messages: [
      {
        id: 7,
        user: "Dr. Raj Patel",
        role: "Researcher",
        verified: true,
        reputation: 445,
        publications: 8,
        content: "Mineral composition analysis suggests Adriatic coastal origins. This could reshape our understanding of medieval trade networks in the region.",
        timestamp: "6 hours ago",
        confidence: 79,
        meshReferences: ["mineral_composition_01"]
      },
      {
        id: 8,
        user: "AI Analysis System",
        role: "AI",
        verified: false,
        content: "Cross-referencing with 2,847 known artifacts shows 73% match to Dalmatian coastal production centers, 12th-14th century. Trade route probability: Byzantine maritime corridors.",
        timestamp: "5 hours ago",
        confidence: 73,
        meshReferences: ["trade_analysis_01", "byzantine_routes_02"]
      }
    ],
    aiSummary: {
      mainTopic: "Cultural origin and trade route analysis",
      keyDebates: ["Adriatic vs Mediterranean origins", "Trade network implications"],
      confidenceDivergence: 6,
      expertConsensus: "Dalmatian coastal production, 12th-14th century",
      openQuestions: ["Specific workshop identification", "Trade volume estimates"]
    }
  }
];

export const mockArtifactSummary = {
  id: "fragment_001",
  name: "Mediterranean Amphora Fragment",
  aiTypology: "Late Medieval Amphora Type B",
  reconstructionConfidence: 87,
  eraEstimate: "12th-14th Century CE",
  status: "Under Review",
  dimensions: {
    height: "23.4 cm",
    rimDiameter: "18.2 cm",
    wallThickness: "0.8-2.3 mm"
  },
  composition: {
    primaryClay: "Southern Italian",
    temper: "Volcanic ash",
    firingTemp: "850°C ± 25°C"
  }
};

export const mockExperts = [
  {
    id: 1,
    name: "Dr. Elena Kamanzi",
    role: "Archaeologist",
    specialization: "Mediterranean Pottery",
    reputation: 847,
    publications: 23,
    verified: true,
    institution: "University of Barcelona"
  },
  {
    id: 2,
    name: "Prof. Marcus Chen",
    role: "Archaeologist",
    specialization: "Structural Analysis",
    reputation: 1203,
    publications: 41,
    verified: true,
    institution: "Oxford Institute of Archaeology"
  },
  {
    id: 3,
    name: "Dr. Sarah Mitchell",
    role: "Archaeologist",
    specialization: "Material Science",
    reputation: 623,
    publications: 15,
    verified: true,
    institution: "MIT Archaeological Materials Lab"
  }
];
