//This is how the code gets JWT from AWS amplify stored in local storage.
import { fetchAuthSession } from 'aws-amplify/auth';

// API Gateway URL
const API_URL = "https://2ar89thnc4.execute-api.us-east-1.amazonaws.com/development"; 

// If the user does not provide a method, it defaults to GET.
// The endpoint is the resource i want to access.
export const apiRequest = async (endpoint, method = "GET", body = null) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens.idToken.toString();
    
    const headers = {
      'Authorization': token,
      'Content-Type': 'application/json'
    };

    const config = {
      method, // HTTP method defined by the function calling the apiRequest
      headers, // Defined above
      body: body ? JSON.stringify(body) : null // body, data, can be defined by the function calling apiRequest
    };

    const response = await fetch(`${API_URL}${endpoint}`, config); // 
    
    if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        return []; // Return empty array on HTTP error
    }

    return await response.json();
  } catch (error) {
    console.error("Network/Auth Error:", error);
    return []; // Return empty array on Crash
  }
};