"use client";

import { useEffect, useState } from "react";
import type { Medicine } from "./types";
import { api } from "./api";

/** Loads the medicines master list (with mock fallback). */
export function useMockCatalog(): { medicines: Medicine[] } {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  useEffect(() => {
    api.getMedicines().then((res) => setMedicines(res.data));
  }, []);
  return { medicines };
}
