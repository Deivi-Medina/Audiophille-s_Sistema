// assets/js/api.js
const BASE_URL = window.baseUrl || "";
if (!BASE_URL) {
  console.warn("⚠️ window.baseUrl no está definido. Usando ruta relativa.");
}

const API_URL = `${BASE_URL}api.php`;

async function handleResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Error del servidor: ${text.substring(0, 100)}`);
  }
  if (!response.ok) {
    const message = data.message || data.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  if (data.success === false) {
    throw new Error(data.message || "Error desconocido en la API");
  }
  return data;
}
export async function get(action, params = {}) {
  let url = API_URL;
  const query = new URLSearchParams();
  query.append("action", action);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      query.append(key, String(params[key]));
    }
  });
  const queryString = query.toString();
  if (queryString) {
    url += (url.includes("?") ? "&" : "?") + queryString;
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return handleResponse(response);
}

export async function post(action, data = {}, options = {}) {
  let body;
  let headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (data instanceof FormData) {
    // ✅ CORREGIDO: Agregar action al FormData
    body = data;
    body.append("action", action);
    // No establecemos Content-Type para FormData (el navegador lo hace automáticamente)
    delete headers["Content-Type"];
  } else {
    const payload = { action, ...data };
    body = JSON.stringify(payload);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers,
    body,
  });
  return handleResponse(response);
}

export async function put(action, data = {}, options = {}) {
  return post(action, data, { ...options, method: "PUT" });
}

export async function del(action, params = {}) {
  return get(action, params);
}

export const api = {
  get,
  post,
  put,
  delete: del,
};
