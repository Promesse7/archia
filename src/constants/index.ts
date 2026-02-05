// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  SLOWER: 400
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

// Grid configurations
export const GRID_CONFIGS = {
  GALLERY: {
    SM: 1,
    MD: 2,
    LG: 3,
    XL: 4
  },
  PUZZLE: {
    QUICK: 3, // 3x3 grid
    TIMED: 4  // 4x4 grid
  }
} as const;

// Camera configurations
export const CAMERA_CONFIG = {
  IDEAL_WIDTH: 1280,
  IDEAL_HEIGHT: 720,
  FACING_MODE: 'environment',
  JPEG_QUALITY: 0.95
} as const;

// 3D Viewer configurations
export const VIEWER_CONFIG = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  ZOOM_STEP: 0.1,
  ROTATION_STEP: 15,
  AUTO_ROTATE_SPEED: 0.01
} as const;

// Fragment classification confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4
} as const;

// Processing timeouts (in milliseconds)
export const TIMEOUTS = {
  CAMERA_INIT: 10000,
  IMAGE_PROCESSING: 30000,
  MODEL_LOADING: 60000
} as const;

// File size limits (in bytes)
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MODEL_MAX_SIZE: 50 * 1024 * 1024  // 50MB
} as const;

// API endpoints
export const API_ENDPOINTS = {
  CLASSIFY: '/api/classify',
  RECONSTRUCT: '/api/reconstruct',
  UPLOAD: '/api/upload'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CAMERA_ACCESS_DENIED: 'Camera access denied. Please check your browser permissions.',
  CAMERA_NOT_FOUND: 'No camera found. Please connect a camera and try again.',
  CAMERA_INIT_FAILED: 'Failed to initialize camera.',
  IMAGE_CAPTURE_FAILED: 'Failed to capture image.',
  PROCESSING_FAILED: 'Failed to process image.',
  MODEL_LOAD_FAILED: 'Failed to load AI models.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image file.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  FRAGMENT_CAPTURED: 'Fragment captured successfully!',
  FRAGMENT_PROCESSED: 'Fragment processed successfully!',
  MODEL_LOADED: 'AI models loaded successfully!',
  PUZZLE_COMPLETED: 'Puzzle completed successfully!'
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  INITIALIZING_CAMERA: 'Initializing camera...',
  CAPTURING_FRAGMENT: 'Capturing fragment...',
  PROCESSING_FRAGMENT: 'Processing fragment...',
  LOADING_MODELS: 'Loading AI models...',
  INITIALIZING_VIEWER: 'Initializing 3D viewer...'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  FRAGMENT_ID: /^[a-zA-Z0-9_-]+$/
} as const;

// Default values
export const DEFAULTS = {
  CONFIDENCE: 0.5,
  ZOOM: 1.0,
  ROTATION: { x: 0, y: 0, z: 0 },
  GRID_SIZE: 9,
  AUTO_ROTATE: false
} as const;
