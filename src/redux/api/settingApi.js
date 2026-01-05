// // import supabase from "../../SupabaseClient";



// export const fetchUserDetailsApi = async () => {
//   try {
//     const response = await fetch("http://localhost:5050/api/settings/users");
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.log("Error fetching users", error);
//     return [];
//   }
// };



// // export const fetchUserDetailsApi = async () => {
// //   try {
// //     const { data, error } = await supabase
// //       .from("users")
// //       .select('*, user_access, leave_date, leave_end_date, remark') // Add leave_end_date
// //       .not("user_name", "is", null)
// //       .neq("user_name", "");

// //     if (error) {
// //       console.log("Error when fetching data", error);
// //       return [];
// //     }

// //     console.log("Fetched successfully", data);
// //     return data;
// //   } catch (error) {
// //     console.log("Error from Supabase", error);
// //     return [];
// //   }
// // };

// export const fetchDepartmentDataApi = async () => {
//   try {
//     const res = await fetch("http://localhost:5050/api/settings/departments");
//     return await res.json();
//   } catch (error) {
//     console.log("Error fetching departments", error);
//     return [];
//   }
// };




// export const createUserApi = async (newUser) => {
//   try {
//     const res = await fetch("http://localhost:5050/api/settings/users", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newUser)
//     });

//     const data = await res.json();
//     return data;
//   } catch (error) {
//     console.log("Error creating user", error);
//   }
// };


// export const updateUserDataApi = async ({ id, updatedUser }) => {
//   try {
//     const res = await fetch(`http://localhost:5050/api/settings/users/${id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(updatedUser)
//     });

//     return await res.json();
//   } catch (error) {
//     console.log("Error updating user", error);
//   }
// };



// export const createDepartmentApi = async (newDept) => {
//   try {
//     const res = await fetch("http://localhost:5050/api/settings/departments", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newDept)
//     });

//     return await res.json();
//   } catch (error) {
//     console.log("Error adding department", error);
//   }
// };


// export const updateDepartmentDataApi = async ({ id, updatedDept }) => {
//   try {
//     const res = await fetch(`http://localhost:5050/api/settings/departments/${id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(updatedDept)
//     });

//     return await res.json();
//   } catch (error) {
//     console.log("Error updating department", error);
//   }
// };



// export const deleteUserByIdApi = async (id) => {
//   try {
//     await fetch(`http://localhost:5050/api/settings/users/${id}`, {
//       method: "DELETE",
//     });
//   } catch (error) {
//     console.log("Error deleting user", error);
//   }
// };




// // In your settingApi.js file, add these functions:






// Dynamic Base URL for settings APIs
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/settings`;

// =======================================================
// 1️⃣ FETCH USERS
// =======================================================
export const fetchUserDetailsApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users`);
    return await response.json();
  } catch (error) {
    console.log("Error fetching users", error);
    return [];
  }
};

// =======================================================
// 2️⃣ FETCH DEPARTMENTS
// =======================================================
export const fetchDepartmentDataApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/departments`);
    return await response.json();
  } catch (error) {
    console.log("Error fetching departments", error);
    return [];
  }
};


// =======================================================
// 3️⃣ CREATE USER
// =======================================================
export const createUserApi = async (newUser) => {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error creating user", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ UPDATE USER
// =======================================================
export const updateUserDataApi = async ({ id, updatedUser }) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    });
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, get text and try to parse
      const text = await response.text();
      console.error("❌ Non-JSON response received:", text.substring(0, 200));
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error("❌ Update user API error:", {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      throw new Error(data.message || data.error || `Server error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error updating user:", error);
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(error.message || "Failed to update user");
  }
};

// =======================================================
// 5️⃣ DELETE USER
// =======================================================
export const deleteUserByIdApi = async (id) => {
  try {
    await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.log("Error deleting user", error);
  }
};

// =======================================================
// 6️⃣ CREATE DEPARTMENT
// =======================================================
export const createDepartmentApi = async (newDept) => {
  try {
    const response = await fetch(`${BASE_URL}/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDept),
    });
    
    return await response.json();
  } catch (error) {
    console.log("Error adding department", error);
    return null;
  }
};

// =======================================================
// 7️⃣ UPDATE DEPARTMENT
// =======================================================
export const updateDepartmentDataApi = async ({ id, updatedDept }) => {
  try {
    const response = await fetch(`${BASE_URL}/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDept),
    });
    
    return await response.json();
  } catch (error) {
    console.log("Error updating department", error);
    return null;
  }
};
// Fetch only unique departments (without given_by)
export const fetchDepartmentsOnlyApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/departments-only`);
    return await response.json();
  } catch (error) {
    console.log("Error fetching departments only", error);
    return [];
  }
};

// Fetch only given_by data
export const fetchGivenByDataApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/given-by`);
    return await response.json();
  } catch (error) {
    console.log("Error fetching given_by data", error);
    return [];
  }
};
