import { createContext, useContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, clearCredentials } from "../store/slices/authSlice";
import { clearFavorites } from "../store/slices/favoritesSlice";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [owner, setOwner] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedOwner = localStorage.getItem("owner");
    if (storedUser && token && role === "user") setUser(JSON.parse(storedUser));
    if (storedOwner && token && role === "owner") setOwner(JSON.parse(storedOwner));
    setLoading(false);
  }, [token, role]);

  const login = (principal, authToken, nextRole = "user") => {
    setToken(authToken);
    setRole(nextRole);
    localStorage.setItem("token", authToken);
    localStorage.setItem("role", nextRole);

    if (nextRole === "owner") {
      setOwner(principal);
      setUser(null);
      localStorage.setItem("owner", JSON.stringify(principal));
      localStorage.removeItem("user");
    } else {
      setUser(principal);
      setOwner(null);
      localStorage.setItem("user", JSON.stringify(principal));
      localStorage.removeItem("owner");
    }

    // Sync to Redux store
    dispatch(setCredentials({ principal, token: authToken, role: nextRole }));
  };

  const logout = () => {
    // Clear Sparky chat history for this user
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser)?.id : "guest";
    sessionStorage.removeItem(`sparky_chat_${userId}`);

    setUser(null);
    setOwner(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("owner");

    // Sync to Redux store
    dispatch(clearCredentials());
    dispatch(clearFavorites());
  };

  return (
    <AuthContext.Provider value={{ user, owner, role, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
