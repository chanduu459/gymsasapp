import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Loader2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'face'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFaceLoading, setIsFaceLoading] = useState(false);
  const [recognizedMember, setRecognizedMember] = useState<any>(null);
  const [faceError, setFaceError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !cameraStreamRef.current) {
      return;
    }

    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => {
      toast.error('Unable to start camera preview');
    });
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera is not supported in this browser');
        return;
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      toast.error('Unable to access camera. Check browser permissions.');
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Failed to capture image from camera');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

    setIsFaceLoading(true);
    setFaceError('');
    setRecognizedMember(null);

    try {
      const response = await api.identifyFace(imageBase64);

      if (response.success && response.data) {
        setRecognizedMember({
          ...response.data.member,
          confidence: response.data.confidence,
        });
        toast.success(`Face recognized: ${response.data.member.full_name} (${Math.round(response.data.confidence)}% match)`);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Face not recognized';
      setFaceError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFaceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-gray-900">GymSaaS Pro</h1>
              <p className="text-sm text-gray-500">Gym Management System</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => {
              setMode('login');
              stopCamera();
            }}
            variant={mode === 'login' ? 'default' : 'outline'}
            className="flex-1"
          >
            Login
          </Button>
          <Button
            onClick={() => setMode('face')}
            variant={mode === 'face' ? 'default' : 'outline'}
            className="flex-1"
          >
            Face Recognition
          </Button>
        </div>

        {mode === 'login' && (
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register your gym
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        )}

        {mode === 'face' && (
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Face Recognition</CardTitle>
            <CardDescription className="text-center">
              Identify yourself with face recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCameraOpen ? (
              <Button
                type="button"
                className="w-full gap-2 h-12"
                onClick={startCamera}
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </Button>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg bg-black aspect-video"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 gap-2"
                    onClick={captureAndIdentify}
                    disabled={isFaceLoading}
                  >
                    {isFaceLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recognizing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Capture & Identify
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={stopCamera}
                    disabled={isFaceLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {recognizedMember && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-1">Face Recognized!</p>
                <p className="text-base font-medium text-green-700">{recognizedMember.full_name}</p>
                <p className="text-xs text-green-600">{recognizedMember.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-600">Confidence: {Math.round(recognizedMember.confidence)}%</p>
                </div>
              </div>
            )}

            {faceError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-1">Recognition Failed</p>
                <p className="text-sm text-red-700">{faceError}</p>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Demo credentials: owner@demo.com / password123
        </p>
      </div>
    </div>
  );
}
