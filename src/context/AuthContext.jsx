import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);


const DEMO_USERS = [
  {
    id: 'admin-1',
    email: 'admin@sskatt.com',
    password: 'admin@123',
    name: 'Admin User',
    role: 'admin',
    department: 'IT',
    isApproved: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'emp-1',
    email: 'john@sskatt.com',
    password: 'john@123',
    name: 'John Doe',
    role: 'employee',
    department: 'Engineering',
    isApproved: true,
    isActive: true,
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'emp-2',
    email: 'sarah@sskatt.com',
    password: 'sarah@123',
    name: 'Sarah Wilson',
    role: 'employee',
    department: 'Marketing',
    isApproved: true,
    isActive: true,
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'emp-3',
    email: 'mike@sskatt.com',
    password: 'mike@123',
    name: 'Mike Johnson',
    role: 'employee',
    department: 'Sales',
    isApproved: true,
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
];

const getDisplayName = (user) => {
  if (!user) return '';
  return (
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    (user.email ? user.email.split('@')[0] : '')
  );
};

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    name: getDisplayName(user),
  };
};

// ─── Local-storage helpers ────────────────────────────────────────────────────
const loadRegisteredUsers = () => {
  try {
    const stored = localStorage.getItem('registeredUsers');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRegisteredUsers = (users) => {
  localStorage.setItem('registeredUsers', JSON.stringify(users));
};

// ─── Provider ─────────────────────────────────────────────────────────────────
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
 
        setUser(normalizeUser(JSON.parse(storedUser)));
 
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
 
        const employeeUser = normalizeUser(employeeData.user);
 
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
 
        const adminUser = normalizeUser(adminData.admin);
 
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
          adminData.message ||
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
  // GET ALL ADMINS
  // ───────────────────────────────────────────

  const getAllAdmins =
    useCallback(async () => {

      try {

        const token =
          localStorage.getItem('token');

        const response = await fetch(
          'http://127.0.0.1:8000/api/admin-auth/all_admins/',
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
  // CREATE USER (admin-initiated, direct create)
  // ───────────────────────────────────────────
  // Used by the User Management tab in AdminDashboard so an admin can create
  // an admin or employee account directly, without the self-signup +
  // approval flow. The account is created already approved/active.
  //
  // NOTE: this calls a new backend endpoint that doesn't exist in the
  // snippets shared so far — `/api/admin-auth/create_user/`. Wire up a
  // matching Django view (mirroring admin_login / all_users auth) that:
  //   - requires a valid admin Bearer token
  //   - accepts { email, password, name, role, department }
  //   - if role === 'admin', creates an Admin record
  //   - if role === 'employee', creates a User record with is_approved=True,
  //     is_active=True (skipping the normal pending-approval step)
  // Adjust the URL/payload below to match your actual endpoint once it
  // exists; the shape here follows the same conventions as signup()/login().

  const createUser =
    useCallback(async ({ email, password, name, role, department }) => {

      try {

        if (!email || !password || !name) {
          return { success: false, error: 'Name, email and password are required.' };
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail.endsWith('@sskatt.com')) {
          return { success: false, error: 'Only company emails (@sskatt.com) are allowed.' };
        }

        const nameParts = name.trim().split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || '';
        const usernameBase =
          normalizedEmail
            .split('@')[0]
            .replace(/[^a-z0-9_]/gi, '')
            .toLowerCase() || 'user';
        const username = `${usernameBase}_${Date.now().toString(36).slice(-5)}`;

        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://127.0.0.1:8000/api/admin-auth/create_user/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: normalizedEmail,
              username,
              first_name,
              last_name,
              password,
              password2: password,
              role: role || 'employee',
              department: department || 'General',
              is_approved: true,
              is_active: true,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          return {
            success: true,
            user: normalizeUser(data.user || data.admin || data),
            message: `${role === 'admin' ? 'Admin' : 'Employee'} account created successfully.`,
          };
        }

        const emailExists = Array.isArray(data?.email)
          ? data.email.some((msg) => String(msg).toLowerCase().includes('already exists'))
          : false;

        if (emailExists) {
          return {
            success: false,
            error: 'Company email already exists. Please use a different email address.',
          };
        }

        return {
          success: false,
          error: data?.message || data?.detail || 'Unable to create account. Please try again.',
        };

      } catch (error) {

        console.error(error);

        return { success: false, error: 'Server error while creating user.' };
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
 




  // ───────────────────────────────────────────
  // REJECT EMPLOYEE
  // ───────────────────────────────────────────

  const rejectEmployee =
    useCallback(async (userId) => {

      try {

        const token =
          localStorage.getItem('token');

        const response = await fetch(
          `http://127.0.0.1:8000/api/user/${userId}/reject_user/`,
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

    getAllAdmins,
 
    getPendingEmployees,

    createUser,
 
    approveEmployee,
 
    deactivateEmployee,
 
    reactivateEmployee,
    rejectEmployee,
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