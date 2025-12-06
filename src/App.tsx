import { Toaster } from "@/components/ui/toaster";
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { authAPI } from "./lib/api";
import AdministratorDashboard from "./pages/AdministratorDashboard";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import AdvisorVaultDashboard from "./pages/AdvisorVaultDashboard";
import Chat from "./pages/Chat";
import CNPDashboard from "./pages/CNPDashboard";
import CreateTopic from "./pages/CreateTopic";
import DelegationDashboard from "./pages/DelegationDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard.tsx";
import Forum from "./pages/Forum";
import GDHRDashboard from "./pages/GDHRDashboard";
import GPIDashboard from "./pages/GPIDashboard";
import Index from "./pages/Index";
import InspectionReportDetail from "./pages/InspectionReportDetail";
import InspectionReportList from "./pages/InspectionReportList";
import InspectionReportNew from "./pages/InspectionReportNew";
import InspectionVisitDetail from "./pages/InspectionVisitDetail";
import InspectionVisitList from "./pages/InspectionVisitList";
import InspectionVisitNew from "./pages/InspectionVisitNew";
import InspectorDashboard from "./pages/InspectorDashboard";
import InspectorMonthlyReportList from "./pages/InspectorMonthlyReportList";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ManageVaultContent from "./pages/ManageVaultContent";
import MCQTestPage from "./pages/MCQTestPage";
import MinisterDashboard from "./pages/MinisterDashboard";
import MinisterDemo from "./pages/MinisterDemo";
import NotFound from "./pages/NotFound";
import ParentDashboard from "./pages/ParentDashboard";
import QAManagement from "./pages/QAManagement";
import QATestPage from "./pages/QATestPage";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherVaultDashboard from "./pages/TeacherVaultDashboard";
import Test from "./pages/Test";
import TestManagement from "./pages/TestManagement";
import TopicDetail from "./pages/TopicDetail";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const user = authAPI.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/old-home" element={<Index />} />
        <Route path="/demo" element={<MinisterDemo />} />
        <Route path="/minister" element={
          <ProtectedRoute allowedRoles={['minister', 'admin']}>
            <MinisterDashboard />
          </ProtectedRoute>
        } />
        <Route path="/test" element={<Test />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mcq-test" element={<MCQTestPage />} />
        <Route path="/qa-test" element={<QATestPage />} />
        <Route path="/test-management" element={<TestManagement />} />
        <Route path="/qa-management" element={<QAManagement />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdministratorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/advisor"
          element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <AdvisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director"
          element={
            <ProtectedRoute allowedRoles={['director']}>
              <DirectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cnp"
          element={
            <ProtectedRoute allowedRoles={['cnp', 'admin']}>
              <CNPDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/visits"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionVisitList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/visits/new"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionVisitNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/visits/:id"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionVisitDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/reports"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionReportList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/reports/new"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionReportNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/reports/:id"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionReportDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspector/monthly-reports"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectorMonthlyReportList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gpi"
          element={
            <ProtectedRoute allowedRoles={['gpi', 'admin']}>
              <GPIDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gpi/reports/:id"
          element={
            <ProtectedRoute allowedRoles={['gpi', 'admin']}>
              <InspectionReportDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delegation"
          element={
            <ProtectedRoute allowedRoles={['delegation', 'admin']}>
              <DelegationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gdhr"
          element={
            <ProtectedRoute allowedRoles={['gdhr', 'admin', 'minister']}>
              <GDHRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault/advisor"
          element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <AdvisorVaultDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/advisor/vault/manage"
          element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <ManageVaultContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherVaultDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'advisor', 'admin', 'minister']}>
              <Forum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/topics/:id"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'advisor', 'admin', 'minister']}>
              <TopicDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/create"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'advisor', 'admin', 'minister']}>
              <CreateTopic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Chat />
            </ProtectedRoute>
          }
        />
          <Route
              path="/secretary"
              element={
                      <SecretaryDashboard />
              }
          />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </LanguageProvider>
  </ThemeProvider>
);

export default App;
