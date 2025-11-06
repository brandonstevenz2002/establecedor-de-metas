// Este archivo ahora solo se preocupa de hacer una petición a nuestro propio backend.
export const suggestStepsForGoal = async (goalTitle: string): Promise<string[]> => {
  try {
    // Llama a tu propia API creada en el Paso 1
    const response = await fetch('/api/suggest-steps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goalTitle }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error en el servidor.");
    }

    const result = await response.json();
    
    if (result && Array.isArray(result.steps)) {
        return result.steps;
    }
    return [];

  } catch (error) {
    console.error("Error llamando al API proxy:", error);
    throw new Error("No se pudieron obtener sugerencias de la IA. Por favor, inténtalo de nuevo.");
  }
};
