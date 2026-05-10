import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import ListingPage from "@/pages/ListingPage";
import VideoDetailPage from "@/pages/VideoDetailPage";
import { AdminLayout } from "@/admin/AdminLayout";
import { LoginPage } from "@/admin/LoginPage";
import { RequireAuth } from "@/admin/RequireAuth";
import { DrivesPage } from "@/admin/DrivesPage";
import { VideosPage } from "@/admin/VideosPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* 主站需要登录 */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/list"
        element={
          <RequireAuth>
            <ListingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/video/:id"
        element={
          <RequireAuth>
            <VideoDetailPage />
          </RequireAuth>
        }
      />

      {/* 管理后台也需要登录 */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/admin/drives" replace />} />
        <Route path="drives" element={<DrivesPage />} />
        <Route path="videos" element={<VideosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
