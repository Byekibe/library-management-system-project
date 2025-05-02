import { Routes, Route } from "react-router";
import Home from "@/pages/Home";
import AuthApp from "@/pages/AuthApp";
import ForgotPasswordPage from "@/pages/auths/ForgotPassword";
import RegisterPage from "@/pages/auths/Register";

const AppRoutes = () => {
    return (
        <Routes>
            <Route index element={<Home />} />  
            <Route path="/login" element={<AuthApp />} />
            <Route path="/forgot-password" element= {<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
    )
}

export default AppRoutes;