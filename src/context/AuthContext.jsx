// src/context/AuthContext.jsx
 
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
 
const AuthContext = createContext(null);
 
// ─────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────
 
export const AuthProvider = ({ children }) => {
 
  const [user, setUser] = useState(null);
 
  const [loading, setLoading] = useState(true);
 
  // ───────────────────────────────────────────
  // LOAD USER FROM LOCAL STORAGE
  // ───────────────────────────────────────────
 
  useEffect(() => {
 
    const storedUser = localStorage.getItem('user');
 
    if (storedUser) {
 
      try {
 
        setUser(JSON.parse(storedUser));
 
      } catch {
 
        localStorage.removeItem('user');
      }
    }
 
    setLoading(false);
 
  }, []);
 
  // ───────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────
 
  const login = async (email, password) => {
 
    try {
 
      // ── EMPLOYEE LOGIN ───────────────────
 
      const employeeResponse = await fetch(
        'http://127.0.0.1:8000/api/user/login/',
        {
          method: 'POST',
 
          headers: {
            'Content-Type': 'application/json',
          },
 
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );
 
      const employeeData =
        await employeeResponse.json();
 
      if (employeeResponse.ok) {
 
        const employeeUser =
          employeeData.user;
 
        setUser(employeeUser);
 
        localStorage.setItem(
          'user',
          JSON.stringify(employeeUser)
        );
 
        localStorage.setItem(
          'token',
          employeeData.token
        );
 
        return {
          success: true,
          user: employeeUser,
        };
      }
 
      // ── ADMIN LOGIN ─────────────────────
 
      const adminResponse = await fetch(
        'http://127.0.0.1:8000/api/admin-auth/admin_login/',
        {
          method: 'POST',
 
          headers: {
            'Content-Type': 'application/json',
          },
 
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );
 
      const adminData =
        await adminResponse.json();
 
      if (adminResponse.ok) {
 
        const adminUser =
          adminData.admin;
 
        setUser(adminUser);
 
        localStorage.setItem(
          'user',
          JSON.stringify(adminUser)
        );
 
        localStorage.setItem(
          'token',
          adminData.token
        );
 
        return {
          success: true,
          user: adminUser,
        };
      }
 
      return {
        success: false,
        error:
          employeeData.message ||
          'Invalid credentials',
      };
 
    } catch (error) {
 
      console.error(error);
 
      return {
        success: false,
        error: 'Server error',
      };
    }
  };
 
  // ───────────────────────────────────────────
  // SIGNUP
  // ───────────────────────────────────────────
 
  const signup = async ({
    email,
    password,
    name,
    department,
  }) => {
 
    try {
 
      if (!email || !password || !name) {
 
        return {
          success: false,
          error: 'All fields are required',
        };
      }
 
      const normalizedEmail =
        email.trim().toLowerCase();
 
      if (
        !normalizedEmail.endsWith('@sskatt.com')
      ) {
 
        return {
          success: false,
          error:
            'Only company emails (@sskatt.com) are allowed.',
        };
      }
 
      // Split name
 
      const nameParts =
        name.trim().split(' ');
 
      const first_name =
        nameParts[0];
 
      const last_name =
        nameParts.slice(1).join(' ') || '';
 
      // Username from email
 
      const username =
        normalizedEmail.split('@')[0];
 
      const response = await fetch(
        'http://127.0.0.1:8000/api/user/register/',
        {
          method: 'POST',
 
          headers: {
            'Content-Type': 'application/json',
          },
 
          body: JSON.stringify({
            email: normalizedEmail,
            username,
            first_name,
            last_name,
            password,
            password2: password,
            department:
              department || 'General',
          }),
        }
      );
 
      const data =
        await response.json();
 
      if (response.ok) {
 
        return {
          success: true,
          pendingApproval: false,
          message:
            'Registration successful. You can now login.',
        };
      }
 
      return {
        success: false,
        error:
          data.message ||
          JSON.stringify(data),
      };
 
    } catch (error) {
 
      console.error(error);
 
      return {
        success: false,
        error: 'Server error',
      };
    }
  };
 
  // ───────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────
 
  const logout = () => {
 
    setUser(null);
 
    localStorage.removeItem('user');
 
    localStorage.removeItem('token');
  };
 
  // ───────────────────────────────────────────
  // GET ALL EMPLOYEES
  // ───────────────────────────────────────────
 
  const getAllEmployees =
    useCallback(async () => {
 
      try {
 
        const token =
          localStorage.getItem('token');
 
        const response = await fetch(
          'http://127.0.0.1:8000/api/admin-auth/all_users/',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
 
        if (!response.ok) {
          return [];
        }
 
        return await response.json();
 
      } catch (error) {
 
        console.error(error);
 
        return [];
      }
 
    }, []);
 
  // ───────────────────────────────────────────
  // GET PENDING EMPLOYEES
  // ───────────────────────────────────────────
 
  const getPendingEmployees =
    useCallback(async () => {
 
      try {
 
        const token =
          localStorage.getItem('token');
 
        const response = await fetch(
          'http://127.0.0.1:8000/api/admin-auth/pending_users/',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
 
        if (!response.ok) {
          return [];
        }
 
        return await response.json();
 
      } catch (error) {
 
        console.error(error);
 
        return [];
      }
 
    }, []);
 
  // ───────────────────────────────────────────
  // APPROVE EMPLOYEE
  // ───────────────────────────────────────────
 
  const approveEmployee =
    useCallback(async (userId) => {
 
      try {
 
        const token =
          localStorage.getItem('token');
 
        const response = await fetch(
          `http://127.0.0.1:8000/api/user/${userId}/approve_user/`,
          {
            method: 'PATCH',
 
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
 
        return response.ok;
 
      } catch (error) {
 
        console.error(error);
 
        return false;
      }
 
    }, []);
 
  // ───────────────────────────────────────────
  // DEACTIVATE EMPLOYEE
  // ───────────────────────────────────────────
 
  const deactivateEmployee =
    useCallback(async (userId) => {
 
      try {
 
        const token =
          localStorage.getItem('token');
 
        const response = await fetch(
          `http://127.0.0.1:8000/api/user/${userId}/deactivate_user/`,
          {
            method: 'PATCH',
 
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
 
        return response.ok;
 
      } catch (error) {
 
        console.error(error);
 
        return false;
      }
 
    }, []);
 
  // ───────────────────────────────────────────
  // REACTIVATE EMPLOYEE
  // ───────────────────────────────────────────
 
  const reactivateEmployee =
    useCallback(async (userId) => {
 
      try {
 
        const token =
          localStorage.getItem('token');
 
        const response = await fetch(
          `http://127.0.0.1:8000/api/user/${userId}/activate_user/`,
          {
            method: 'PATCH',
 
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
 
        return response.ok;
 
      } catch (error) {
 
        console.error(error);
 
        return false;
      }
 
    }, []);
 
  // ───────────────────────────────────────────
  // CONTEXT VALUE
  // ───────────────────────────────────────────
 
  const value = {
 
    user,
 
    login,
 
    signup,
 
    logout,
 
    loading,
 
    isAuthenticated: !!user,
 
    isAdmin:
      user?.role === 'admin',
 
    getAllEmployees,
 
    getPendingEmployees,
 
    approveEmployee,
 
    deactivateEmployee,
 
    reactivateEmployee,
  };
 
  return (
 
    <AuthContext.Provider value={value}>
 
      {children}
 
    </AuthContext.Provider>
  );
};
 
// ─────────────────────────────────────────────
// USE AUTH HOOK
// ─────────────────────────────────────────────
 
export const useAuth = () => {
 
  const context =
    useContext(AuthContext);
 
  if (!context) {
 
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }
 
  return context;
};
 