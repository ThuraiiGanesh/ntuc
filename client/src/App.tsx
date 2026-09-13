import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { BottomNav, ActiveTab } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { FoodDiaryView } from './components/diary/FoodDiaryView';
import { RecommendationsView } from './components/recommend/RecommendationsView';
import { MealPlanView } from './components/mealplan/MealPlanView';
import { WeeklyProgressView } from './components/weekly/WeeklyProgressView';
import { CameraScanModal } from './components/camera/CameraScanModal';
import { AIResultModal } from './components/food/AIResultModal';
import { ManualFoodSearchModal } from './components/food/ManualFoodSearchModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { LoginPage } from './components/auth/LoginPage';
import { UserProfile, DailySummary, VisionResult, FoodLogEntry, HawkerDish, NextRecommendation } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recommendations, setRecommendations] = useState<NextRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAIResultOpen, setIsAIResultOpen] = useState(false);
  const [aiResult, setAIResult] = useState<VisionResult | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check login state on mount
  useEffect(() => {
    checkAuthAndInit();
  }, []);

  const checkAuthAndInit = async () => {
    setLoading(true);
    try {
      const meData = await api.getMe();
      if (meData.authenticated && meData.user) {
        setCurrentUser(meData.user);
        setProfile(meData.profile);
        await loadUserData();
      } else {
        // Not logged in
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Authentication check failed:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [sumData, recData] = await Promise.all([
        api.getDailyLogs(),
        api.getNextRecommendations()
      ]);
      setSummary(sumData);
      setRecommendations(recData.recommendations || []);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleLoginSuccess = async (
    _token: string,
    user: { id: string; name: string; email: string },
    userProfile: UserProfile
  ) => {
    setCurrentUser(user);
    setProfile(userProfile);
    setLoading(true);
    await loadUserData();
    setLoading(false);
    if (!userProfile.onboarded) {
      setIsOnboardingOpen(true);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setProfile(null);
    setSummary(null);
    setRecommendations([]);
    setIsSettingsOpen(false);
  };

  const refreshDailyData = async () => {
    try {
      const [sumData, recData] = await Promise.all([
        api.getDailyLogs(),
        api.getNextRecommendations()
      ]);
      setSummary(sumData);
      setRecommendations(recData.recommendations || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  // Handlers
  const handleIdentifiedFood = (result: VisionResult, photoUrl: string) => {
    setIsScannerOpen(false);
    setAIResult(result);
    setCapturedPhoto(photoUrl);
    setIsAIResultOpen(true);
  };

  const handleLoggedMeal = (_entry: FoodLogEntry) => {
    refreshDailyData();
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await api.deleteLogEntry(id);
      refreshDailyData();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleUpdateLog = async (id: string, updates: Partial<FoodLogEntry>) => {
    try {
      await api.updateLogEntry(id, updates);
      refreshDailyData();
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  const handleAddWater = async (amount_ml: number = 250) => {
    try {
      await api.logWater(amount_ml);
      refreshDailyData();
    } catch (err) {
      console.error('Failed to log water:', err);
    }
  };

  const handleSelectCatalogDish = (dish: HawkerDish) => {
    setIsManualSearchOpen(false);
    const fakeResult: VisionResult = {
      dish_id: dish.id,
      dish_name: dish.name_en,
      name_local: dish.name_local,
      confidence: 1.0,
      category: dish.category,
      estimated_portion_size: dish.portion_default,
      portion_multiplier: 1.0,
      calories: dish.calories,
      protein_g: dish.protein_g,
      carbs_g: dish.carbs_g,
      fat_g: dish.fat_g,
      sodium_mg: dish.sodium_mg,
      sugar_g: dish.sugar_g,
      healthier_alternative: dish.healthier_alternative,
      alternative_dishes_if_uncertain: [],
      ai_notes: 'Selected from Singapore Hawker catalog.',
      source: 'smart_classifier'
    };
    setAIResult(fakeResult);
    setCapturedPhoto('https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    setIsAIResultOpen(true);
  };

  // If loading session check
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex flex-col items-center justify-center p-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 animate-spin flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/25">
          🍲
        </div>
        <p className="text-xs font-bold text-rose-500/80 animate-pulse">Connecting to Hawker Nutrition DB...</p>
      </div>
    );
  }

  // If not logged in, show Login / Register page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF0F4] flex justify-center selection:bg-pink-500 selection:text-white">
      {/* Mobile-first Frame Container */}
      <div className="mobile-app-shell w-full flex flex-col">
        
        {/* Top Sticky Header */}
        <Navbar
          profile={profile}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <DashboardView
              summary={summary}
              recommendations={recommendations}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenManualSearch={() => setIsManualSearchOpen(true)}
              onAddWater={handleAddWater}
              onDeleteLog={handleDeleteLog}
              onSelectRecommendedDish={handleSelectCatalogDish}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'diary' && (
            <FoodDiaryView
              summary={summary}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenManualSearch={() => setIsManualSearchOpen(true)}
              onDeleteLog={handleDeleteLog}
              onUpdateLog={handleUpdateLog}
            />
          )}

          {activeTab === 'recommend' && (
            <RecommendationsView
              summary={summary}
              onSelectDish={handleSelectCatalogDish}
            />
          )}

          {activeTab === 'plans' && (
            <MealPlanView onSelectDish={handleSelectCatalogDish} />
          )}

          {activeTab === 'progress' && (
            <WeeklyProgressView />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        {/* Camera / Photo Scanner Modal */}
        <CameraScanModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onIdentified={handleIdentifiedFood}
          onOpenManualSearch={() => {
            setIsScannerOpen(false);
            setIsManualSearchOpen(true);
          }}
        />

        {/* AI Result & Live Portion Adjuster Modal */}
        <AIResultModal
          isOpen={isAIResultOpen}
          result={aiResult}
          photoUrl={capturedPhoto}
          onClose={() => setIsAIResultOpen(false)}
          onLogged={handleLoggedMeal}
          onOpenManualSearch={() => {
            setIsAIResultOpen(false);
            setIsManualSearchOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Manual Food Search Catalog Modal */}
        <ManualFoodSearchModal
          isOpen={isManualSearchOpen}
          onClose={() => setIsManualSearchOpen(false)}
          onSelectDish={handleSelectCatalogDish}
        />

        {/* Onboarding Wizard Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          initialProfile={profile}
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setIsOnboardingOpen(false);
            refreshDailyData();
          }}
          onClose={() => setIsOnboardingOpen(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          profile={profile}
          currentUser={currentUser}
          onClose={() => setIsSettingsOpen(false)}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            refreshDailyData();
          }}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;
