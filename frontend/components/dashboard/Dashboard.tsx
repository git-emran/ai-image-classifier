import { useAuth } from "../auth";
import { useState } from "react";
import { AnalysisResults } from "@/types";
import { ImageData } from "@/types";
import { apiService } from "@/services";
import { Camera, LogOut } from "lucide-react";
import ImageUpload from "./ImageUpload";
import BoundingBoxOverlay from "./BoundingBoxOverlay";
import { Loader2 } from "lucide-react";
import { MessageSquare } from "lucide-react";
import ChatInterface from "./ChatInterface";


const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [image, setImage] = useState<ImageData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError('');

    try {
      const results = await apiService.analyzeImage(image.data, image.type);
      setAnalysisData(results);
      setShowChat(true);
    } catch (err) {
      setError('Failed to analyze image. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setAnalysisData(null);
    setShowChat(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Gemini Vision</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Image Upload/Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Analysis</h2>

            {!image ? (
              <ImageUpload onImageSelect={setImage} />
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.preview}
                    alt="Uploaded"
                    className="w-full h-auto"
                  />
                  {analysisData && (
                    <BoundingBoxOverlay
                      objects={analysisData.detected_objects}
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Image'
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
            <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Chat Assistant</h2>
            </div>

            {!image || !showChat ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Upload and analyze an image to start chatting
                  </p>
                </div>
              </div>
            ) : (
              <ChatInterface image={image} analysisData={analysisData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
